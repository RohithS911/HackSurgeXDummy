/**
 * @fileoverview Type definitions for Agricultural Intelligence Engine
 * Using JSDoc for type safety in JavaScript
 */

/**
 * @typedef {Object} LocationData
 * @property {number} latitude
 * @property {number} longitude
 * @property {string} district
 * @property {string} state
 * @property {string} country
 * @property {string} formatted_address
 */

/**
 * @typedef {Object} SoilProperties
 * @property {number} soil_ph - pH value (3.0-10.0)
 * @property {number} nitrogen_content - Percentage (0-1.0)
 * @property {number} organic_carbon - Percentage (0-10.0)
 * @property {number} soil_clay_percentage - Percentage (0-100)
 * @property {number} soil_sand_percentage - Percentage (0-100)
 * @property {number} cec - Cation exchange capacity
 */

/**
 * @typedef {Object} WeatherForecastDay
 * @property {string} date
 * @property {number} temp_max
 * @property {number} temp_min
 * @property {number} rainfall_mm
 * @property {number} humidity
 */

/**
 * @typedef {Object} WeatherData
 * @property {number} temperature - Celsius
 * @property {number} rainfall_30d - mm in last 30 days
 * @property {number} humidity - Percentage
 * @property {WeatherForecastDay[]} weather_forecast_7_days
 */

/**
 * @typedef {Object} SatelliteMetrics
 * @property {number} ndvi - -1.0 to 1.0
 * @property {number} vegetation_stress_index - 0.0 to 1.0
 * @property {number} soil_moisture_index - 0.0 to 1.0
 * @property {string} acquisition_date
 * @property {number} cloud_coverage - Percentage
 */

/**
 * @typedef {Object} CropHealthData
 * @property {string[]} crop_stress_indicators
 * @property {string} vegetation_growth_stage
 * @property {number} health_score - 0-100
 */

/**
 * @typedef {Object} FertilizerRecommendation
 * @property {string} npk_ratio
 * @property {number} nitrogen_kg_per_acre
 * @property {number} phosphorus_kg_per_acre
 * @property {number} potassium_kg_per_acre
 * @property {string[]} organic_amendments
 * @property {string} application_method
 */

/**
 * @typedef {Object} FertilityAnalysis
 * @property {number} fertility_score - 0-100
 * @property {Object} calculation_details
 * @property {number} calculation_details.nitrogen_contribution
 * @property {number} calculation_details.organic_carbon_contribution
 * @property {number} calculation_details.ph_contribution
 * @property {string} classification - "poor", "moderate", "good", "excellent"
 */

/**
 * @typedef {Object} NutrientStatus
 * @property {string} nitrogen_level - "deficient", "moderate", "sufficient"
 * @property {string} phosphorus_level
 * @property {string} potassium_level
 * @property {string[]} deficiencies
 */

/**
 * @typedef {Object} RiskAssessment
 * @property {string} drought_risk - "low", "medium", "high"
 * @property {string} nutrient_deficiency_risk
 * @property {number} crop_stress_probability - 0-100
 * @property {string} pest_disease_risk
 * @property {string[]} risk_factors
 */

/**
 * @typedef {Object} ApplicationScheduleItem
 * @property {string} timing
 * @property {number} amount_kg
 * @property {string} method
 * @property {string} weather_conditions
 */

/**
 * @typedef {Object} FertilizerAdvice
 * @property {string} fertilizer_type
 * @property {string} npk_ratio
 * @property {number} dosage_per_acre
 * @property {ApplicationScheduleItem[]} application_schedule
 * @property {string[]} organic_alternatives
 * @property {number} cost_estimate
 */

/**
 * @typedef {Object} CropScoringFactors
 * @property {number} soil_suitability
 * @property {number} climate_match
 * @property {number} water_requirement_match
 * @property {number} market_potential
 */

/**
 * @typedef {Object} CropRecommendation
 * @property {string} crop_name
 * @property {number} crop_priority_score - 0-100
 * @property {CropScoringFactors} scoring_factors
 * @property {string} expected_yield
 * @property {string} growing_season
 * @property {string} water_requirement
 */

/**
 * @typedef {Object} IrrigationScheduleItem
 * @property {string} date
 * @property {string} action
 * @property {number} volume
 */

/**
 * @typedef {Object} IrrigationPlan
 * @property {string} immediate_action - "irrigate_now", "delay", "monitor"
 * @property {number} volume_liters_per_sqm
 * @property {number} frequency_days
 * @property {IrrigationScheduleItem[]} schedule
 * @property {string[]} water_conservation_tips
 */

/**
 * @typedef {Object} AnalysisReport
 * @property {string} report_id
 * @property {string} report_timestamp
 * @property {string} language_code
 * @property {boolean} offline_mode
 * @property {LocationData} location
 * @property {Object} soil_analysis
 * @property {NutrientStatus} nutrient_status
 * @property {FertilizerAdvice} fertilizer_recommendation
 * @property {Object} crop_recommendation
 * @property {CropRecommendation[]} crop_recommendation.suitable_crops
 * @property {boolean} crop_recommendation.soil_improvement_needed
 * @property {Object} environment_analysis
 * @property {RiskAssessment} risk_assessment
 * @property {IrrigationPlan} irrigation_plan
 * @property {Object} farmer_advice
 * @property {string} farmer_advice.summary
 * @property {string[]} farmer_advice.priority_actions
 * @property {string} farmer_advice.detailed_advice
 * @property {Object} metadata
 * @property {string[]} metadata.data_sources_used
 * @property {Object} metadata.data_freshness
 * @property {number} metadata.confidence_level
 * @property {number} metadata.processing_time_ms
 * @property {string} metadata.methodology_notes
 * @property {string[]} errors
 * @property {string[]} warnings
 */

/**
 * @typedef {Object} CacheEntry
 * @property {string} id
 * @property {string} service
 * @property {Object} request_params
 * @property {any} response_data
 * @property {number} timestamp
 * @property {number} expiry
 * @property {number} cache_duration_hours
 */

/**
 * @typedef {Object} HistoricalAnalysis
 * @property {number} id
 * @property {string} report_id
 * @property {number} timestamp
 * @property {Object} location
 * @property {number} location.latitude
 * @property {number} location.longitude
 * @property {string} location.district
 * @property {string} location.state
 * @property {string} soil_type
 * @property {number} fertility_score
 * @property {string} language
 * @property {AnalysisReport} complete_report
 */

export {};
