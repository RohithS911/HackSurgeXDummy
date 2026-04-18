/**
 * Agricultural Intelligence Engine Services
 * Export all API services
 */

export { BaseAPIService } from './BaseAPIService.js';
export { GeocoderService } from './GeocoderService.js';
export { SoilGridsService } from './SoilGridsService.js';
export { WeatherService } from './WeatherService.js';
export { SatelliteService } from './SatelliteService.js';
export { CropHealthService } from './CropHealthService.js';
export { FertilizerService } from './FertilizerService.js';
export { BhuvanService } from './BhuvanService.js';
export { SoilHealthCardService } from './SoilHealthCardService.js';
export { FAOStatService } from './FAOStatService.js';
export { AgriculturalAdvisorService } from './AgriculturalAdvisorService.js';

// Create service instances
import { GeocoderService } from './GeocoderService.js';
import { SoilGridsService } from './SoilGridsService.js';
import { WeatherService } from './WeatherService.js';
import { SatelliteService } from './SatelliteService.js';
import { CropHealthService } from './CropHealthService.js';
import { FertilizerService } from './FertilizerService.js';
import { BhuvanService } from './BhuvanService.js';
import { SoilHealthCardService } from './SoilHealthCardService.js';
import { FAOStatService } from './FAOStatService.js';

export const geocoderService = new GeocoderService();
export const soilGridsService = new SoilGridsService();
export const weatherService = new WeatherService();
export const satelliteService = new SatelliteService();
export const cropHealthService = new CropHealthService();
export const fertilizerService = new FertilizerService();
export const bhuvanService = new BhuvanService();
export const soilHealthCardService = new SoilHealthCardService();
export const faoStatService = new FAOStatService();

export default {
  geocoderService,
  soilGridsService,
  weatherService,
  satelliteService,
  cropHealthService,
  fertilizerService,
  bhuvanService,
  soilHealthCardService,
  faoStatService
};
