/**
 * Agricultural Advisory Expert Service
 * Generates detailed farming reports for Indian farmers
 * Based on agronomic knowledge, government guidelines, and environmental data
 */

export class AgriculturalAdvisorService {
  /**
   * Generate comprehensive agricultural advisory report
   * @param {Object} data - Complete analysis data
   * @param {string} language - Target language (en, hi, kn, ta, te, mr, etc.)
   * @returns {Object} Structured advisory report
   */
  generateReport(data, language = 'en') {
    // Extract and validate data
    const soilPrediction = {
      soil_type: data.soil_type,
      confidence: data.confidence,
      texture: this.determineSoilTexture(data.clay, data.sand)
    };

    const location = {
      latitude: data.location?.latitude,
      longitude: data.location?.longitude,
      district: data.location?.district || 'Unknown',
      state: data.location?.state || 'Unknown',
      country: data.location?.country || 'India'
    };

    const weather = {
      temperature: data.weather?.temperature,
      humidity: data.weather?.humidity,
      rainfall_last_30_days: data.weather?.rainfall_30d || 0,
      rainfall_forecast_7_days: this.calculateForecastRainfall(data.weather?.forecast)
    };

    const satelliteData = {
      ndvi: data.satellite?.ndvi,
      soil_moisture_index: data.satellite?.soil_moisture_index || data.bhuvan_soil_moisture?.percentage / 100,
      vegetation_stress_index: data.satellite?.vegetation_stress_index
    };

    const soilProperties = {
      soil_ph: data.ph,
      nitrogen: data.soil_health_card?.macro_nutrients?.nitrogen || data.ml_nutrient_status?.nitrogen,
      phosphorus: data.soil_health_card?.macro_nutrients?.phosphorus || data.ml_nutrient_status?.phosphorus,
      potassium: data.soil_health_card?.macro_nutrients?.potassium || data.ml_nutrient_status?.potassium,
      organic_carbon: data.organic_carbon
    };

    const governmentData = {
      soil_health_card_parameters: data.soil_health_card,
      state_specific_recommendations: data.soil_health_card?.recommendations || []
    };

    const faoData = {
      crop_suitability: data.fao_crop_recommendations?.recommended_crops || data.recommended_crops,
      fertilizer_guidelines: data.ml_fertilizer,
      climate_smart_practices: this.getClimateSmartPractices(data.soil_type)
    };

    // Perform agricultural reasoning
    const analysis = this.performAgriculturalAnalysis({
      soilPrediction,
      location,
      weather,
      satelliteData,
      soilProperties,
      governmentData,
      faoData
    });

    // Generate structured report
    const report = this.structureReport(analysis, language);

    return report;
  }

  /**
   * Perform comprehensive agricultural analysis
   */
  performAgriculturalAnalysis(inputs) {
    const { soilPrediction, location, weather, satelliteData, soilProperties, governmentData, faoData } = inputs;

    // 1. Validate soil prediction
    const soilValidation = this.validateSoilPrediction(soilPrediction, soilProperties);

    // 2. Interpret soil fertility
    const fertilityStatus = this.interpretSoilFertility(soilProperties);

    // 3. Interpret moisture condition
    const moistureCondition = this.interpretMoistureCondition(weather, satelliteData);

    // 4. Interpret vegetation condition
    const vegetationCondition = this.interpretVegetationCondition(satelliteData);

    // 5. Identify nutrient deficiencies
    const nutrientDeficiencies = this.identifyNutrientDeficiencies(soilProperties, governmentData);

    // 6. Generate fertilizer plan
    const fertilizerPlan = this.generateFertilizerPlan(soilProperties, nutrientDeficiencies, location.state);

    // 7. Recommend crops
    const cropRecommendations = this.recommendCrops(soilPrediction, soilProperties, weather, faoData);

    // 8. Evaluate farming risks
    const riskAssessment = this.evaluateFarmingRisks(weather, satelliteData, soilProperties, moistureCondition);

    // 9. Generate irrigation advice
    const irrigationAdvice = this.generateIrrigationAdvice(weather, moistureCondition, soilPrediction);

    // 10. Climate resilient practices
    const climateSmartPractices = this.selectClimateSmartPractices(faoData, location, soilPrediction);

    // 11. Financial analysis (cost, yield, profit, risk vs reward)
    const topCropName = cropRecommendations.top_crops[0]?.name || 'Rice';
    const financialAnalysis = this.generateFinancialAnalysis(soilPrediction, weather, topCropName, riskAssessment);

    // 12. Weather impact insight for the primary crop
    const weatherImpact = this.generateWeatherImpact(weather, topCropName);

    return {
      location,
      soilValidation,
      fertilityStatus,
      moistureCondition,
      vegetationCondition,
      nutrientDeficiencies,
      fertilizerPlan,
      cropRecommendations,
      riskAssessment,
      irrigationAdvice,
      climateSmartPractices,
      financialAnalysis,
      weatherImpact
    };
  }

  /**
   * Validate soil prediction using soil properties
   */
  validateSoilPrediction(prediction, properties) {
    const confidence = prediction.confidence * 100;
    let validation = 'high';
    
    if (confidence < 60) validation = 'low';
    else if (confidence < 80) validation = 'medium';

    return {
      soil_type: prediction.soil_type,
      texture: prediction.texture,
      confidence_level: validation,
      confidence_percentage: confidence.toFixed(1)
    };
  }

  /**
   * Interpret soil fertility
   */
  interpretSoilFertility(properties) {
    const { soil_ph, nitrogen, phosphorus, potassium, organic_carbon } = properties;

    // pH interpretation
    let phStatus = 'neutral';
    let phAdvice = 'Soil pH is optimal for most crops.';
    if (soil_ph < 5.5) {
      phStatus = 'acidic';
      phAdvice = 'Soil is acidic. Apply lime to raise pH.';
    } else if (soil_ph > 8.0) {
      phStatus = 'alkaline';
      phAdvice = 'Soil is alkaline. Apply gypsum or sulfur to lower pH.';
    } else if (soil_ph < 6.5) {
      phStatus = 'slightly_acidic';
      phAdvice = 'Soil is slightly acidic. Suitable for most crops.';
    } else if (soil_ph > 7.5) {
      phStatus = 'slightly_alkaline';
      phAdvice = 'Soil is slightly alkaline. Monitor nutrient availability.';
    }

    // Organic carbon interpretation
    let ocStatus = 'medium';
    let ocAdvice = 'Organic matter is adequate.';
    if (organic_carbon < 0.5) {
      ocStatus = 'low';
      ocAdvice = 'Low organic matter. Add compost or farmyard manure.';
    } else if (organic_carbon > 1.5) {
      ocStatus = 'high';
      ocAdvice = 'Good organic matter content. Maintain with crop residues.';
    }

    // Overall fertility
    let overallFertility = 'medium';
    if (ocStatus === 'high' && phStatus === 'neutral') {
      overallFertility = 'high';
    } else if (ocStatus === 'low' || phStatus === 'acidic' || phStatus === 'alkaline') {
      overallFertility = 'low';
    }

    return {
      overall_fertility: overallFertility,
      ph_status: phStatus,
      ph_value: soil_ph,
      ph_advice: phAdvice,
      organic_carbon_status: ocStatus,
      organic_carbon_value: organic_carbon,
      organic_carbon_advice: ocAdvice
    };
  }

  /**
   * Interpret moisture condition
   */
  interpretMoistureCondition(weather, satellite) {
    const rainfall30d = weather.rainfall_last_30_days || 0;
    const rainfall7d = weather.rainfall_forecast_7_days || 0;
    const soilMoisture = satellite.soil_moisture_index || 0.3;

    let moistureStatus = 'adequate';
    let advice = 'Soil moisture is adequate for crop growth.';

    if (soilMoisture < 0.2 && rainfall30d < 20) {
      moistureStatus = 'very_low';
      advice = 'Critical water shortage. Immediate irrigation required.';
    } else if (soilMoisture < 0.3 && rainfall30d < 50) {
      moistureStatus = 'low';
      advice = 'Low soil moisture. Plan irrigation within 2-3 days.';
    } else if (soilMoisture > 0.7 || rainfall30d > 200) {
      moistureStatus = 'high';
      advice = 'High soil moisture. Ensure proper drainage.';
    }

    return {
      status: moistureStatus,
      soil_moisture_percentage: (soilMoisture * 100).toFixed(1),
      rainfall_30d: rainfall30d,
      rainfall_forecast_7d: rainfall7d,
      advice: advice
    };
  }

  /**
   * Interpret vegetation condition using NDVI
   */
  interpretVegetationCondition(satellite) {
    const ndvi = satellite.ndvi || 0.5;

    let condition = 'moderate';
    let health = 'fair';
    let advice = 'Vegetation health is moderate.';

    if (ndvi < 0.2) {
      condition = 'bare_soil';
      health = 'no_vegetation';
      advice = 'Little to no vegetation. Suitable for planting.';
    } else if (ndvi < 0.4) {
      condition = 'sparse';
      health = 'poor';
      advice = 'Sparse vegetation. Check for stress factors.';
    } else if (ndvi < 0.6) {
      condition = 'moderate';
      health = 'fair';
      advice = 'Moderate vegetation. Monitor crop health.';
    } else if (ndvi < 0.8) {
      condition = 'healthy';
      health = 'good';
      advice = 'Healthy vegetation. Continue current practices.';
    } else {
      condition = 'very_healthy';
      health = 'excellent';
      advice = 'Excellent vegetation health.';
    }

    return {
      condition: condition,
      health: health,
      ndvi_value: ndvi.toFixed(2),
      advice: advice
    };
  }

  /**
   * Identify nutrient deficiencies
   */
  identifyNutrientDeficiencies(properties, governmentData) {
    const deficiencies = [];
    const recommendations = [];

    // Check nitrogen
    const nValue = typeof properties.nitrogen === 'string' ? properties.nitrogen : 
                   (properties.nitrogen < 200 ? 'Low' : properties.nitrogen < 280 ? 'Medium' : 'High');
    
    if (nValue === 'Low' || properties.nitrogen < 200) {
      deficiencies.push('Nitrogen');
      recommendations.push('Apply urea @ 100-120 kg/ha or use green manure');
    }

    // Check phosphorus
    const pValue = typeof properties.phosphorus === 'string' ? properties.phosphorus :
                   (properties.phosphorus < 20 ? 'Low' : properties.phosphorus < 30 ? 'Medium' : 'High');
    
    if (pValue === 'Low' || properties.phosphorus < 20) {
      deficiencies.push('Phosphorus');
      recommendations.push('Apply DAP @ 80-100 kg/ha or SSP @ 150-200 kg/ha');
    }

    // Check potassium
    const kValue = typeof properties.potassium === 'string' ? properties.potassium :
                   (properties.potassium < 120 ? 'Low' : properties.potassium < 200 ? 'Medium' : 'High');
    
    if (kValue === 'Low' || properties.potassium < 120) {
      deficiencies.push('Potassium');
      recommendations.push('Apply MOP (Muriate of Potash) @ 60-80 kg/ha');
    }

    // Check pH-related deficiencies
    if (properties.soil_ph < 5.5) {
      deficiencies.push('Lime (due to acidity)');
      recommendations.push('Apply lime @ 2-4 quintals/ha to correct acidity');
    } else if (properties.soil_ph > 8.5) {
      deficiencies.push('Gypsum (due to alkalinity)');
      recommendations.push('Apply gypsum @ 2-3 quintals/ha to correct alkalinity');
    }

    // Add government recommendations
    if (governmentData.state_specific_recommendations) {
      recommendations.push(...governmentData.state_specific_recommendations.slice(0, 2));
    }

    return {
      deficiencies: deficiencies.length > 0 ? deficiencies : ['None detected'],
      recommendations: recommendations.length > 0 ? recommendations : ['Maintain balanced fertilization']
    };
  }

  /**
   * Generate fertilizer plan following Indian guidelines
   */
  generateFertilizerPlan(properties, deficiencies, state) {
    const plan = {
      npk_ratio: '20:20:20',
      nitrogen_kg_per_ha: 120,
      phosphorus_kg_per_ha: 60,
      potassium_kg_per_ha: 40,
      application_schedule: [],
      organic_alternatives: []
    };

    // Adjust based on deficiencies
    if (deficiencies.deficiencies.includes('Nitrogen')) {
      plan.nitrogen_kg_per_ha = 150;
      plan.npk_ratio = '30:15:15';
    }
    if (deficiencies.deficiencies.includes('Phosphorus')) {
      plan.phosphorus_kg_per_ha = 90;
    }
    if (deficiencies.deficiencies.includes('Potassium')) {
      plan.potassium_kg_per_ha = 60;
    }

    // Application schedule
    plan.application_schedule = [
      `Basal dose: Apply ${Math.round(plan.nitrogen_kg_per_ha * 0.5)} kg N, ${plan.phosphorus_kg_per_ha} kg P, ${plan.potassium_kg_per_ha} kg K per hectare at sowing`,
      `First top dressing: Apply ${Math.round(plan.nitrogen_kg_per_ha * 0.25)} kg N per hectare at 30 days after sowing`,
      `Second top dressing: Apply ${Math.round(plan.nitrogen_kg_per_ha * 0.25)} kg N per hectare at 60 days after sowing`
    ];

    // Organic alternatives
    plan.organic_alternatives = [
      'Farmyard manure (FYM) @ 10-15 tons/ha',
      'Vermicompost @ 2-3 tons/ha',
      'Green manure crops (Dhaincha, Sunhemp) before main crop',
      'Neem cake @ 200-300 kg/ha for nitrogen'
    ];

    return plan;
  }

  /**
   * Recommend crops suitable for soil and climate
   */
  recommendCrops(soilPrediction, properties, weather, faoData) {
    const soilType = soilPrediction.soil_type.toLowerCase();
    const crops = [];

    // Get FAO recommendations
    const faoCrops = faoData.crop_suitability || [];

    // Add soil-specific crops with explanations
    if (soilType.includes('black')) {
      crops.push(
        { name: 'Cotton', reason: 'Black soil retains moisture well, ideal for cotton' },
        { name: 'Wheat', reason: 'Thrives in black soil with good nutrient retention' },
        { name: 'Sorghum', reason: 'Drought-resistant, suitable for black soil' },
        { name: 'Chickpea', reason: 'Grows well in black soil with moderate moisture' }
      );
    } else if (soilType.includes('red')) {
      crops.push(
        { name: 'Groundnut', reason: 'Well-drained red soil is perfect for groundnut' },
        { name: 'Millets', reason: 'Drought-tolerant, suitable for red soil' },
        { name: 'Pulses', reason: 'Improves soil nitrogen, grows well in red soil' },
        { name: 'Cotton', reason: 'Suitable with proper irrigation' }
      );
    } else if (soilType.includes('alluvial')) {
      crops.push(
        { name: 'Rice', reason: 'Alluvial soil is highly fertile, ideal for rice' },
        { name: 'Wheat', reason: 'Excellent yields in alluvial soil' },
        { name: 'Sugarcane', reason: 'High nutrient content supports sugarcane' },
        { name: 'Vegetables', reason: 'Fertile soil perfect for vegetable cultivation' }
      );
    } else if (soilType.includes('laterite')) {
      crops.push(
        { name: 'Cashew', reason: 'Laterite soil is ideal for cashew plantations' },
        { name: 'Coconut', reason: 'Thrives in laterite soil with good drainage' },
        { name: 'Tea', reason: 'Acidic laterite soil suits tea cultivation' },
        { name: 'Coffee', reason: 'Well-drained laterite soil is perfect for coffee' }
      );
    } else {
      // Default recommendations
      crops.push(
        { name: 'Rice', reason: 'Versatile crop suitable for most soil types' },
        { name: 'Wheat', reason: 'Widely adaptable to various soil conditions' },
        { name: 'Maize', reason: 'Grows well in diverse soil types' },
        { name: 'Pulses', reason: 'Improves soil health through nitrogen fixation' }
      );
    }

    // Consider weather
    if (weather.rainfall_last_30_days < 50) {
      crops.push({ name: 'Millets', reason: 'Drought-resistant, suitable for low rainfall' });
    }

    return {
      top_crops: crops.slice(0, 5),
      fao_recommended: faoCrops.slice(0, 5)
    };
  }

  /**
   * Evaluate farming risks
   */
  evaluateFarmingRisks(weather, satellite, properties, moistureCondition) {
    const risks = [];
    const mitigations = [];

    // Drought risk
    if (moistureCondition.status === 'very_low' || moistureCondition.status === 'low') {
      risks.push({
        type: 'Drought Stress',
        severity: moistureCondition.status === 'very_low' ? 'High' : 'Medium',
        description: 'Low soil moisture and insufficient rainfall'
      });
      mitigations.push('Install drip irrigation system');
      mitigations.push('Apply mulch to conserve soil moisture');
      mitigations.push('Choose drought-resistant crop varieties');
    }

    // Nutrient deficiency risk
    if (properties.organic_carbon < 0.5) {
      risks.push({
        type: 'Nutrient Deficiency',
        severity: 'Medium',
        description: 'Low organic matter reduces nutrient availability'
      });
      mitigations.push('Add organic manure regularly');
      mitigations.push('Practice crop rotation with legumes');
    }

    // pH-related risks
    if (properties.soil_ph < 5.5 || properties.soil_ph > 8.5) {
      risks.push({
        type: 'pH Imbalance',
        severity: 'Medium',
        description: 'Extreme pH affects nutrient uptake'
      });
      mitigations.push(properties.soil_ph < 5.5 ? 'Apply lime to raise pH' : 'Apply gypsum to lower pH');
    }

    // Waterlogging risk
    if (moistureCondition.status === 'high') {
      risks.push({
        type: 'Waterlogging',
        severity: 'Medium',
        description: 'Excess water can damage crop roots'
      });
      mitigations.push('Improve field drainage');
      mitigations.push('Create raised beds for crops');
    }

    if (risks.length === 0) {
      risks.push({
        type: 'Low Risk',
        severity: 'Low',
        description: 'Current conditions are favorable for farming'
      });
      mitigations.push('Continue monitoring soil and weather conditions');
    }

    return {
      risks: risks,
      mitigation_strategies: mitigations
    };
  }

  /**
   * Generate irrigation advice
   */
  generateIrrigationAdvice(weather, moistureCondition, soilPrediction) {
    const advice = {
      timing: '',
      frequency: '',
      method: '',
      water_requirement: '',
      tips: []
    };

    // Determine irrigation timing
    if (moistureCondition.status === 'very_low') {
      advice.timing = 'Immediate irrigation required';
      advice.frequency = 'Every 3-4 days until moisture improves';
    } else if (moistureCondition.status === 'low') {
      advice.timing = 'Irrigate within 2-3 days';
      advice.frequency = 'Every 5-7 days depending on crop';
    } else if (moistureCondition.status === 'adequate') {
      advice.timing = 'Monitor soil moisture, irrigate when needed';
      advice.frequency = 'Every 7-10 days or as per crop requirement';
    } else {
      advice.timing = 'No irrigation needed currently';
      advice.frequency = 'Wait for soil to dry, ensure drainage';
    }

    // Recommend irrigation method
    const soilType = soilPrediction.soil_type.toLowerCase();
    if (soilType.includes('sandy') || soilType.includes('red')) {
      advice.method = 'Drip irrigation (most efficient for well-drained soil)';
    } else if (soilType.includes('clay') || soilType.includes('black')) {
      advice.method = 'Furrow or sprinkler irrigation (suitable for heavy soil)';
    } else {
      advice.method = 'Drip or sprinkler irrigation (recommended for water efficiency)';
    }

    // Water requirement
    advice.water_requirement = '25-30 mm per irrigation for most crops';

    // Tips
    advice.tips = [
      'Irrigate early morning or evening to reduce evaporation',
      'Check soil moisture at 15 cm depth before irrigating',
      'Avoid over-irrigation to prevent nutrient leaching',
      'Use mulch to retain soil moisture'
    ];

    if (weather.rainfall_forecast_7_days > 20) {
      advice.tips.push(`Rainfall expected (${weather.rainfall_forecast_7_days}mm in 7 days) - adjust irrigation accordingly`);
    }

    return advice;
  }

  /**
   * Select climate-smart practices
   */
  selectClimateSmartPractices(faoData, location, soilPrediction) {
    const practices = [
      {
        practice: 'Conservation Tillage',
        benefit: 'Reduces soil erosion and improves water retention',
        implementation: 'Minimize plowing, leave crop residues on field'
      },
      {
        practice: 'Crop Rotation',
        benefit: 'Improves soil health and breaks pest cycles',
        implementation: 'Rotate cereals with legumes (e.g., wheat-chickpea)'
      },
      {
        practice: 'Integrated Nutrient Management',
        benefit: 'Balances organic and inorganic fertilizers',
        implementation: 'Combine FYM with chemical fertilizers at 50:50 ratio'
      },
      {
        practice: 'Water Conservation',
        benefit: 'Reduces water usage and improves efficiency',
        implementation: 'Install drip irrigation, practice mulching'
      },
      {
        practice: 'Organic Matter Addition',
        benefit: 'Improves soil structure and fertility',
        implementation: 'Add compost, vermicompost, or green manure'
      }
    ];

    // Add soil-specific practices
    if (soilPrediction.soil_type.toLowerCase().includes('red') || soilPrediction.soil_type.toLowerCase().includes('laterite')) {
      practices.push({
        practice: 'Lime Application',
        benefit: 'Corrects soil acidity and improves nutrient availability',
        implementation: 'Apply lime @ 2-4 quintals/ha every 2-3 years'
      });
    }

    return practices.slice(0, 6);
  }

  /**
   * Structure the final report
   */
  structureReport(analysis, language) {
    const fa = analysis.financialAnalysis;
    const wi = analysis.weatherImpact;

    const report = {
      language: language,
      sections: {
        farm_location: {
          title: 'Farm Location',
          content: `${analysis.location.district}, ${analysis.location.state}, ${analysis.location.country}`
        },
        
        soil_analysis: {
          title: 'Soil Analysis',
          soil_type: analysis.soilValidation.soil_type,
          texture: analysis.soilValidation.texture,
          confidence: `${analysis.soilValidation.confidence_percentage}% (${analysis.soilValidation.confidence_level} confidence)`,
          fertility: analysis.fertilityStatus.overall_fertility,
          ph_status: `pH ${analysis.fertilityStatus.ph_value} - ${analysis.fertilityStatus.ph_status}`,
          organic_matter: `${analysis.fertilityStatus.organic_carbon_value}% - ${analysis.fertilityStatus.organic_carbon_status}`,
          interpretation: `Your soil is ${analysis.soilValidation.soil_type} with ${analysis.soilValidation.texture} texture. ${analysis.fertilityStatus.ph_advice} ${analysis.fertilityStatus.organic_carbon_advice}`
        },
        
        nutrient_status: {
          title: 'Nutrient Status',
          deficiencies: analysis.nutrientDeficiencies.deficiencies,
          explanation: analysis.nutrientDeficiencies.deficiencies.length > 1 && analysis.nutrientDeficiencies.deficiencies[0] !== 'None detected'
            ? `Your soil is deficient in ${analysis.nutrientDeficiencies.deficiencies.join(', ')}. These nutrients are essential for healthy crop growth and good yields.`
            : 'Your soil nutrient levels are adequate. Maintain balanced fertilization to sustain soil health.'
        },
        
        fertilizer_recommendation: {
          title: 'Fertilizer Recommendation',
          npk_ratio: analysis.fertilizerPlan.npk_ratio,
          dosage: {
            nitrogen: `${analysis.fertilizerPlan.nitrogen_kg_per_ha} kg/ha`,
            phosphorus: `${analysis.fertilizerPlan.phosphorus_kg_per_ha} kg/ha`,
            potassium: `${analysis.fertilizerPlan.potassium_kg_per_ha} kg/ha`
          },
          schedule: analysis.fertilizerPlan.application_schedule,
          organic_options: analysis.fertilizerPlan.organic_alternatives,
          specific_recommendations: analysis.nutrientDeficiencies.recommendations
        },
        
        crop_recommendation: {
          title: 'Crop Recommendation',
          top_crops: analysis.cropRecommendations.top_crops,
          explanation: `Based on your ${analysis.soilValidation.soil_type} and current weather conditions, the following crops are most suitable for your farm.`
        },

        // ── NEW: Cost Breakdown ──
        cost_breakdown: {
          title: 'Cost Per Acre',
          crop: fa.crop,
          items: [
            { label: 'Seed Cost',        value: fa.seed_cost,        icon: '🌱' },
            { label: 'Fertilizer Cost',  value: fa.fertilizer_cost,  icon: '💊' },
            { label: 'Pesticide Cost',   value: fa.pesticide_cost,   icon: '🧴' },
            { label: 'Labour Cost',      value: fa.labour_cost,      icon: '👷' }
          ],
          total: fa.total_cost,
          note: `Estimated cost to grow ${fa.crop} on 1 acre of your soil type.`
        },

        // ── NEW: Profit Estimation ──
        profit_estimation: {
          title: 'Yield & Profit Estimation',
          crop: fa.crop,
          expected_yield_qtl: fa.expected_yield_qtl,
          yield_label: `${fa.expected_yield_qtl} quintals per acre`,
          market_price_per_qtl: fa.market_price_per_qtl,
          market_price_label: `₹${fa.market_price_per_qtl.toLocaleString('en-IN')} per quintal (current avg)`,
          gross_revenue: fa.gross_revenue,
          total_cost: fa.total_cost,
          expected_profit: fa.expected_profit,
          profit_label: fa.expected_profit >= 0
            ? `You spend ₹${fa.total_cost.toLocaleString('en-IN')} and may earn ₹${fa.gross_revenue.toLocaleString('en-IN')} → Profit of ₹${fa.expected_profit.toLocaleString('en-IN')}`
            : `This crop may not be profitable this season. Consider alternatives.`,
          return_ratio: fa.return_ratio
        },

        // ── NEW: Risk Analysis ──
        risk_analysis: {
          title: 'Risk vs Reward',
          crop: fa.crop,
          risk_level: fa.risk_level,
          risk_reasons: fa.risk_reasons,
          ratio_statement: fa.ratio_statement,
          verdict: fa.verdict
        },

        // ── NEW: Weather Impact ──
        weather_impact: {
          title: 'Weather Impact on Your Crop',
          crop: wi.crop,
          season_effect: wi.season_effect,
          rainfall_effect: wi.rainfall_effect,
          temperature_effect: wi.temperature_effect,
          warnings: wi.warnings,
          overall_summary: wi.overall_summary
        },
        
        irrigation_advice: {
          title: 'Irrigation Advice',
          current_moisture: `Soil moisture: ${analysis.moistureCondition.soil_moisture_percentage}% - ${analysis.moistureCondition.status}`,
          timing: analysis.irrigationAdvice.timing,
          frequency: analysis.irrigationAdvice.frequency,
          method: analysis.irrigationAdvice.method,
          water_requirement: analysis.irrigationAdvice.water_requirement,
          tips: analysis.irrigationAdvice.tips,
          explanation: analysis.moistureCondition.advice
        },
        
        risk_assessment: {
          title: 'Risk Assessment',
          risks: analysis.riskAssessment.risks,
          mitigation: analysis.riskAssessment.mitigation_strategies,
          explanation: analysis.riskAssessment.risks.length > 0 && analysis.riskAssessment.risks[0].type !== 'Low Risk'
            ? 'The following risks have been identified for your farm. Take preventive measures to protect your crops.'
            : 'Your farm conditions are currently favorable. Continue monitoring regularly.'
        },
        
        climate_smart_practices: {
          title: 'Climate-Smart Farming Practices',
          practices: analysis.climateSmartPractices,
          explanation: 'Adopt these sustainable practices to improve soil health, conserve resources, and increase resilience to climate change.'
        },
        
        vegetation_status: {
          title: 'Current Vegetation Status',
          ndvi: analysis.vegetationCondition.ndvi_value,
          health: analysis.vegetationCondition.health,
          advice: analysis.vegetationCondition.advice
        }
      }
    };

    return report;
  }

  // ─────────────────────────────────────────────────────────────────
  //  FINANCIAL ANALYSIS
  // ─────────────────────────────────────────────────────────────────

  /**
   * Per-crop default financials (₹ per acre, quintals per acre)
   * These are realistic Indian average estimates.
   */
  getCropFinancialDefaults(cropName) {
    const name = (cropName || 'rice').toLowerCase();
    const defaults = {
      rice:      { seed: 2000, fertilizer: 3500, pesticide: 1500, labour: 5000, yield_qtl: 25, price_per_qtl: 1900 },
      paddy:     { seed: 2000, fertilizer: 3500, pesticide: 1500, labour: 5000, yield_qtl: 25, price_per_qtl: 1900 },
      wheat:     { seed: 1800, fertilizer: 3000, pesticide: 1200, labour: 4500, yield_qtl: 22, price_per_qtl: 1800 },
      groundnut: { seed: 3000, fertilizer: 2500, pesticide: 2000, labour: 5500, yield_qtl: 15, price_per_qtl: 4500 },
      cotton:    { seed: 2500, fertilizer: 4000, pesticide: 3000, labour: 6000, yield_qtl: 12, price_per_qtl: 5000 },
      millets:   { seed: 1200, fertilizer: 2000, pesticide: 1000, labour: 4000, yield_qtl: 18, price_per_qtl: 2100 },
      jowar:     { seed: 1200, fertilizer: 2000, pesticide: 1000, labour: 4000, yield_qtl: 18, price_per_qtl: 2200 },
      bajra:     { seed: 1000, fertilizer: 1800, pesticide:  800, labour: 3800, yield_qtl: 20, price_per_qtl: 2100 },
      maize:     { seed: 1500, fertilizer: 2800, pesticide: 1200, labour: 4200, yield_qtl: 22, price_per_qtl: 1600 },
      sorghum:   { seed: 1200, fertilizer: 2000, pesticide: 1000, labour: 4000, yield_qtl: 18, price_per_qtl: 2200 },
      sugarcane: { seed: 5000, fertilizer: 5000, pesticide: 2500, labour: 8000, yield_qtl: 350, price_per_qtl: 290 },
      pulses:    { seed: 2500, fertilizer: 1500, pesticide: 1200, labour: 4000, yield_qtl: 8,  price_per_qtl: 5500 },
      chickpea:  { seed: 2500, fertilizer: 1500, pesticide: 1200, labour: 4000, yield_qtl: 8,  price_per_qtl: 4000 },
      soybean:   { seed: 2000, fertilizer: 2500, pesticide: 1500, labour: 4500, yield_qtl: 12, price_per_qtl: 3500 },
      cashew:    { seed: 1500, fertilizer: 3000, pesticide: 2000, labour: 6000, yield_qtl: 8,  price_per_qtl: 12000 },
      coconut:   { seed: 2000, fertilizer: 3500, pesticide: 1500, labour: 5000, yield_qtl: 10, price_per_qtl: 8000 },
      tea:       { seed: 3000, fertilizer: 4500, pesticide: 2500, labour: 9000, yield_qtl: 12, price_per_qtl: 6000 },
      coffee:    { seed: 3000, fertilizer: 4000, pesticide: 2000, labour: 8000, yield_qtl: 8,  price_per_qtl: 9000 },
      vegetables:{ seed: 2000, fertilizer: 3000, pesticide: 2000, labour: 6000, yield_qtl: 40, price_per_qtl: 800  }
    };

    // Try exact match, then partial match, then default to rice
    if (defaults[name]) return defaults[name];
    for (const key of Object.keys(defaults)) {
      if (name.includes(key) || key.includes(name)) return defaults[key];
    }
    return defaults['rice'];
  }

  /**
   * Compute cost, yield, profit and risk level for the primary crop.
   */
  generateFinancialAnalysis(soilPrediction, weather, cropName, riskAssessment) {
    const d = this.getCropFinancialDefaults(cropName);

    // Soil suitability adjustment (±10% yield)
    const soilType = soilPrediction.soil_type.toLowerCase();
    let yieldModifier = 1.0;
    if (soilType.includes('alluvial')) yieldModifier = 1.1;
    else if (soilType.includes('black')) yieldModifier = 1.05;
    else if (soilType.includes('laterite')) yieldModifier = 0.90;
    else if (soilType.includes('sandy')) yieldModifier = 0.92;

    const seed_cost       = d.seed;
    const fertilizer_cost = d.fertilizer;
    const pesticide_cost  = d.pesticide;
    const labour_cost     = d.labour;
    const total_cost      = seed_cost + fertilizer_cost + pesticide_cost + labour_cost;

    const expected_yield_qtl   = Math.round(d.yield_qtl * yieldModifier);
    const market_price_per_qtl = d.price_per_qtl;
    const gross_revenue        = expected_yield_qtl * market_price_per_qtl;
    const expected_profit      = gross_revenue - total_cost;
    const return_ratio         = total_cost > 0 ? (gross_revenue / total_cost).toFixed(2) : '1.00';

    // Risk level: based on existing risk assessment + rainfall + profit margin
    const highRisks = riskAssessment.risks.filter(r => r.severity === 'High').length;
    const rainfall  = weather.rainfall_last_30_days || 0;
    const profitMargin = gross_revenue > 0 ? expected_profit / gross_revenue : 0;

    let risk_level = 'Low';
    const risk_reasons = [];

    if (highRisks > 0) {
      risk_level = 'High';
      risk_reasons.push('High-severity farming risks detected (drought/pH/waterlogging)');
    } else if (riskAssessment.risks.length > 1) {
      risk_level = 'Medium';
      risk_reasons.push('Multiple farm risks identified');
    }

    if (rainfall < 30) {
      if (risk_level !== 'High') risk_level = 'Medium';
      risk_reasons.push('Low rainfall — irrigation dependency is high');
    } else if (rainfall > 180) {
      if (risk_level !== 'High') risk_level = 'Medium';
      risk_reasons.push('Excess rainfall — waterlogging risk is present');
    }

    if (profitMargin < 0.2) {
      if (risk_level === 'Low') risk_level = 'Medium';
      risk_reasons.push('Thin profit margin — market price fluctuation could affect returns');
    }

    if (risk_reasons.length === 0) {
      risk_reasons.push('Soil suitable for crop', 'Adequate rainfall expected', 'Good profit margin');
    }

    const profitFmt   = `₹${expected_profit.toLocaleString('en-IN')}`;
    const costFmt     = `₹${total_cost.toLocaleString('en-IN')}`;
    const revenueFmt  = `₹${gross_revenue.toLocaleString('en-IN')}`;

    let verdict = 'Good return';
    if      (parseFloat(return_ratio) >= 2.5) verdict = 'Excellent return 🌟';
    else if (parseFloat(return_ratio) >= 1.8) verdict = 'Good return ✅';
    else if (parseFloat(return_ratio) >= 1.2) verdict = 'Moderate return ⚠️';
    else                                       verdict = 'Low return — consider alternatives ❌';

    const ratio_statement = `You spend ${costFmt} and may earn ${revenueFmt} → ${verdict}`;

    return {
      crop:               cropName,
      seed_cost,
      fertilizer_cost,
      pesticide_cost,
      labour_cost,
      total_cost,
      expected_yield_qtl,
      market_price_per_qtl,
      gross_revenue,
      expected_profit,
      return_ratio,
      risk_level,
      risk_reasons,
      ratio_statement,
      verdict
    };
  }

  /**
   * Explain how current weather affects the chosen crop.
   */
  generateWeatherImpact(weather, cropName) {
    const crop     = cropName;
    const rainfall = weather.rainfall_last_30_days || 0;
    const temp     = weather.temperature || 25;
    const warnings = [];

    // Season inference from temperature
    let season = 'Rabi (winter)';
    if (temp >= 28) season = 'Kharif (monsoon)';
    else if (temp >= 22) season = 'Zaid (summer)';

    // Crop water requirements
    const highWaterCrops  = ['rice', 'paddy', 'sugarcane', 'vegetables'];
    const lowWaterCrops   = ['millets', 'jowar', 'bajra', 'millet', 'sorghum', 'groundnut', 'pulses', 'chickpea', 'cotton'];
    const cropLower = crop.toLowerCase();
    const needsHighWater  = highWaterCrops.some(c => cropLower.includes(c));
    const needsLowWater   = lowWaterCrops.some(c  => cropLower.includes(c));

    let rainfall_effect;
    if (rainfall < 30) {
      rainfall_effect = `Rainfall is low (${rainfall} mm in last 30 days). ${crop} needs more water — plan irrigation now.`;
      warnings.push('⚠️ Low rainfall warning: Irrigate regularly to protect your crop yield.');
    } else if (rainfall > 150) {
      rainfall_effect = `Rainfall is high (${rainfall} mm in last 30 days). Ensure drainage to avoid waterlogging near ${crop} roots.`;
      warnings.push('⚠️ Excess rain warning: Check fields for waterlogging and improve drainage.');
    } else {
      rainfall_effect = `Rainfall is moderate (${rainfall} mm in last 30 days). Good for ${crop} growth — continue normal irrigation.`;
    }

    if (needsHighWater && rainfall < 50) {
      warnings.push(`⚠️ ${crop} requires high water. Low rain may reduce yield significantly.`);
    }
    if (needsLowWater && rainfall > 120) {
      warnings.push(`⚠️ ${crop} prefers dry conditions. Excess rain may cause fungal diseases.`);
    }

    let temperature_effect;
    if (temp < 18) {
      temperature_effect = `Temperature is cool (${temp}°C). Good for Rabi crops but frost can damage tender plants.`;
    } else if (temp > 38) {
      temperature_effect = `Temperature is very high (${temp}°C). Heat stress may reduce yield of ${crop} — provide shade/extra water.`;
      warnings.push('⚠️ Heat stress warning: High temperature can cause crop wilting.');
    } else {
      temperature_effect = `Temperature is suitable (${temp}°C) for growing ${crop} in the ${season} season.`;
    }

    const season_effect = `It is currently the ${season} season. ${crop} is ${
      season.includes('Kharif') ? 'a Kharif crop — good time to sow after monsoon rain.' :
      season.includes('Rabi')   ? 'a Rabi crop — sow after the monsoon retreats, harvest in spring.' :
                                  'a summer crop — needs irrigation as natural rains are low.'
    }`;

    const overall_summary = warnings.length === 0
      ? `Weather looks good for ${crop} this season. Keep monitoring moisture levels.`
      : `Pay attention to the warnings above to protect your ${crop} yield.`;

    return { crop, season, season_effect, rainfall_effect, temperature_effect, warnings, overall_summary };
  }

  // ─────────────────────────────────────────────────────────────────
  //  HELPER METHODS
  // ─────────────────────────────────────────────────────────────────

  // Helper methods

  determineSoilTexture(clay, sand) {
    if (!clay || !sand) return 'Unknown';
    
    const silt = 100 - clay - sand;
    
    if (clay > 40) return 'Clay';
    if (sand > 60) return 'Sandy';
    if (silt > 50) return 'Silty';
    if (clay > 25 && sand > 45) return 'Sandy Clay Loam';
    if (clay > 25 && silt > 25) return 'Clay Loam';
    if (sand > 50 && clay < 20) return 'Sandy Loam';
    return 'Loam';
  }

  calculateForecastRainfall(forecast) {
    if (!forecast || !Array.isArray(forecast)) return 0;
    return forecast.reduce((sum, day) => sum + (day.rainfall_mm || 0), 0);
  }

  getClimateSmartPractices(soilType) {
    // This would integrate with FAO data
    return [
      'Conservation tillage',
      'Crop rotation',
      'Integrated nutrient management',
      'Water conservation',
      'Organic matter addition'
    ];
  }
}

export default AgriculturalAdvisorService;
