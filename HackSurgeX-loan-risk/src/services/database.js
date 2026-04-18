// IndexedDB Database Service for Soil Analysis History
const DB_NAME = 'SoilAnalyzerDB';
const DB_VERSION = 1;
const STORE_NAME = 'analysisHistory';

class DatabaseService {
  constructor() {
    this.db = null;
  }

  // Initialize database
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Database failed to open');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('Database opened successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true
          });

          // Create indexes for efficient querying
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          objectStore.createIndex('soil_type', 'soil_type', { unique: false });
          objectStore.createIndex('language', 'language', { unique: false });

          console.log('Object store created');
        }
      };
    });
  }

  // Add new analysis to database
  async addAnalysis(analysisData) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);

      // Add timestamp and language if not present
      const data = {
        ...analysisData,
        timestamp: analysisData.timestamp || Date.now(),
        language: analysisData.language || 'en'
      };

      const request = objectStore.add(data);

      request.onsuccess = () => {
        console.log('Analysis added to database with ID:', request.result);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Error adding analysis:', request.error);
        reject(request.error);
      };
    });
  }

  // Get all analyses (sorted by timestamp, newest first)
  async getAllAnalyses() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const index = objectStore.index('timestamp');

      const request = index.openCursor(null, 'prev'); // Descending order
      const results = [];

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          console.log('Retrieved', results.length, 'analyses from database');
          resolve(results);
        }
      };

      request.onerror = () => {
        console.error('Error retrieving analyses:', request.error);
        reject(request.error);
      };
    });
  }

  // Get analysis by ID
  async getAnalysisById(id) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.get(id);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Get recent analyses (limit)
  async getRecentAnalyses(limit = 10) {
    const allAnalyses = await this.getAllAnalyses();
    return allAnalyses.slice(0, limit);
  }

  // Search analyses by soil type
  async searchBySoilType(soilType) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const index = objectStore.index('soil_type');

      const request = index.getAll(soilType);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Delete analysis by ID
  async deleteAnalysis(id) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.delete(id);

      request.onsuccess = () => {
        console.log('Analysis deleted:', id);
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Clear all analyses
  async clearAllAnalyses() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.clear();

      request.onsuccess = () => {
        console.log('All analyses cleared');
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Get statistics
  async getStatistics() {
    const analyses = await this.getAllAnalyses();

    const stats = {
      totalAnalyses: analyses.length,
      soilTypes: {},
      averagePh: 0,
      dateRange: {
        oldest: null,
        newest: null
      }
    };

    if (analyses.length === 0) return stats;

    let totalPh = 0;
    let phCount = 0;

    analyses.forEach(analysis => {
      // Count soil types
      const soilType = analysis.soil_type || 'Unknown';
      stats.soilTypes[soilType] = (stats.soilTypes[soilType] || 0) + 1;

      // Calculate average pH
      if (analysis.ph) {
        totalPh += parseFloat(analysis.ph);
        phCount++;
      }

      // Track date range
      const timestamp = analysis.timestamp;
      if (!stats.dateRange.oldest || timestamp < stats.dateRange.oldest) {
        stats.dateRange.oldest = timestamp;
      }
      if (!stats.dateRange.newest || timestamp > stats.dateRange.newest) {
        stats.dateRange.newest = timestamp;
      }
    });

    stats.averagePh = phCount > 0 ? (totalPh / phCount).toFixed(2) : 0;

    return stats;
  }

  // Export data as JSON
  async exportData() {
    const analyses = await this.getAllAnalyses();
    return JSON.stringify(analyses, null, 2);
  }

  // Import data from JSON
  async importData(jsonData) {
    try {
      const analyses = JSON.parse(jsonData);
      
      for (const analysis of analyses) {
        // Remove id to let database auto-generate
        const { id, ...data } = analysis;
        await this.addAnalysis(data);
      }

      console.log('Imported', analyses.length, 'analyses');
      return analyses.length;
    } catch (error) {
      console.error('Import error:', error);
      throw error;
    }
  }
}

// Create singleton instance
const databaseService = new DatabaseService();

// Initialize on load
databaseService.init().catch(err => {
  console.error('Failed to initialize database:', err);
});

export default databaseService;
