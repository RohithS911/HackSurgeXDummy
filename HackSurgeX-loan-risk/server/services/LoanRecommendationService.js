/**
 * Loan Recommendation Service
 * Matches farmer profile from soil analysis to relevant government/bank loan schemes
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const loanSchemes = require('./loanSchemes.json');

class LoanRecommendationService {
  /**
   * Recommend loan schemes based on analysis data
   * @param {Object} analysis - Full soil analysis result
   * @returns {Object} Loan recommendations section
   */
  recommend(analysis) {
    const state = analysis.location?.state || '';
    const soilType = (analysis.soil_type || '').toLowerCase();
    const crops = (analysis.recommended_crops || []).map(c => c.toLowerCase());

    const scored = loanSchemes.map(scheme => {
      let score = scheme.rag_metadata.priority_score;

      // Boost state-specific schemes if state matches
      const eligibleStates = scheme.eligibility.eligible_states || [];
      if (eligibleStates.length > 0) {
        const stateMatch = eligibleStates.some(s =>
          state.toLowerCase().includes(s.toLowerCase())
        );
        if (stateMatch) score += 3;
        else return null;
      }

      // Boost if soil type matches
      const suitableSoils = scheme.rag_metadata.suitable_soil_types || [];
      if (!suitableSoils.includes('all')) {
        const soilMatch = suitableSoils.some(s => soilType.includes(s));
        if (soilMatch) score += 2;
      }

      // Boost if crop matches
      const suitableCrops = scheme.rag_metadata.suitable_crops || [];
      if (!suitableCrops.includes('all')) {
        const cropMatch = suitableCrops.some(c =>
          crops.some(fc => fc.includes(c.toLowerCase()))
        );
        if (cropMatch) score += 2;
      }

      return { scheme, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6); // Top 6 for detailed view

    // Total cost per acre from financial analysis (embedded by AgriculturalAdvisorService)
    const totalCostPerAcre = analysis.advisory_report?.sections?.cost_breakdown?.total
      || analysis.total_cost_per_acre
      || 12000; // conservative default

    // Find the best-matching scheme (lowest cost that still covers farmer's need)
    let bestMatchIdx = 0;
    let bestMatchScore = -Infinity;
    scored.forEach(({ scheme, score }, idx) => {
      const amount = this.parseAmount(scheme.max_loan_amount);
      // Prefer schemes that cover total cost but aren't excessively large
      const coverageBonus = amount >= totalCostPerAcre ? 10 : -5;
      const schemeScore = score + coverageBonus;
      if (schemeScore > bestMatchScore) {
        bestMatchScore = schemeScore;
        bestMatchIdx = idx;
      }
    });

    const mapped = scored.map(({ scheme }, idx) => ({
      name: scheme.scheme_name,
      type: scheme.scheme_type,
      provider: scheme.provider,
      loan_type: scheme.loan_type,
      max_amount: scheme.max_loan_amount,
      interest_rate: scheme.interest_rate,
      subsidy: scheme.subsidy_details,
      eligibility: scheme.eligibility,
      documents: scheme.documents_required,
      application_process: scheme.application_process,
      apply_at: scheme.application_process?.official_portal || '',
      benefits: scheme.benefits,
      special_features: scheme.special_features || [],
      repayment: scheme.repayment_tenure,
      tags: scheme.tags,
      // Repayment ease classification
      repayment_ease: this.classifyRepaymentEase(scheme),
      // Best match flag
      best_match: idx === bestMatchIdx,
      // Full TTS-ready description
      tts_description: this.buildTTSDescription(scheme)
    }));

    const bestScheme = mapped[bestMatchIdx];
    const recommended_loan_option = bestScheme
      ? `${bestScheme.name} — covers your estimated cost of ₹${totalCostPerAcre.toLocaleString('en-IN')}. Repayment: ${bestScheme.repayment}. Ease: ${bestScheme.repayment_ease}.`
      : 'Contact your nearest bank for a suitable Kisan Credit Card loan.';

    const summary = `${mapped.length} loan and subsidy schemes are available for your farm. ` +
      mapped.map(s => s.name).join(', ') + '.';

    return {
      recommended_schemes: mapped,
      summary,
      recommended_loan_option,
      total_cost_covered: totalCostPerAcre,
      disclaimer: 'Eligibility is subject to bank and government verification. Visit official portals for the latest terms and conditions.',
      tts_full: this.buildFullTTS(mapped)
    };
  }

  /**
   * Classify repayment ease based on interest rate and subsidy
   */
  classifyRepaymentEase(scheme) {
    const rate   = (scheme.interest_rate || '').toLowerCase();
    const subsidy = (scheme.subsidy_details || '').toLowerCase();

    // 0% or heavy subsidy → Easy
    if (rate.includes('0%') || rate.includes('interest free') || subsidy.includes('0%')) {
      return 'Easy';
    }
    // Very low effective rate (≤4%) → Easy
    if (rate.includes('effective') && (rate.includes('4%') || rate.includes('3%') || rate.includes('2%') || rate.includes('1%'))) {
      return 'Easy';
    }
    // ~3–4% → Easy/Moderate
    if (rate.match(/[1-4](\.\d+)?%/) || rate.includes('subsidised') || rate.includes('subvention')) {
      return 'Moderate';
    }
    // Anything >7% → Risky
    if (rate.match(/[7-9]\d*(\.\d+)?%/) || rate.match(/1[0-9](\.\d+)?%/)) {
      return 'Risky';
    }
    return 'Moderate';
  }

  /**
   * Parse a loan amount string like "Up to Rs 3 lakh" → number in rupees
   */
  parseAmount(amountStr) {
    if (!amountStr) return 0;
    const str = amountStr.toLowerCase();
    const match = str.match(/([\d.]+)\s*(lakh|crore|thousand)?/);
    if (!match) return 0;
    let val = parseFloat(match[1]);
    if (str.includes('crore'))   val *= 10_000_000;
    else if (str.includes('lakh')) val *= 100_000;
    else if (str.includes('thousand')) val *= 1_000;
    return val;
  }

  buildTTSDescription(scheme) {
    const parts = [];
    parts.push(`${scheme.scheme_name} by ${scheme.provider}.`);
    parts.push(`Loan type: ${scheme.loan_type}.`);
    parts.push(`Maximum loan amount: ${scheme.max_loan_amount}.`);
    parts.push(`Interest rate: ${scheme.interest_rate}.`);
    if (scheme.subsidy_details && scheme.subsidy_details !== 'None') {
      parts.push(`Subsidy: ${scheme.subsidy_details}.`);
    }
    parts.push(`Repayment tenure: ${scheme.repayment_tenure}.`);
    if (scheme.benefits?.length) {
      parts.push(`Key benefits: ${scheme.benefits.join(', ')}.`);
    }
    if (scheme.special_features?.length) {
      parts.push(`Special features: ${scheme.special_features.join(', ')}.`);
    }
    parts.push(`Documents required: ${scheme.documents_required?.join(', ')}.`);
    if (scheme.application_process?.official_portal) {
      parts.push(`Apply online at: ${scheme.application_process.official_portal}.`);
    }
    return parts.join(' ');
  }

  buildFullTTS(schemes) {
    const intro = `Here are the recommended loan and subsidy schemes for your farm. `;
    const body = schemes.map((s, i) =>
      `Scheme ${i + 1}: ${s.tts_description}`
    ).join(' ... ');
    const outro = ' Please visit the official portals or your nearest bank branch to apply. Good luck with your farming.';
    return intro + body + outro;
  }
}

export default new LoanRecommendationService();
