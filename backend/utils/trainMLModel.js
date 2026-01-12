const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5000';

const trainMLModel = async () => {
    try {
        console.log('Training ML recommendation model...');
        const response = await axios.post(`${ML_SERVICE_URL}/train`, {}, { 
            timeout: 60000,
            validateStatus: function (status) {
                return status < 500;
            }
        });
        
        if (response.status === 200 || response.status === 201) {
            console.log('ML model trained successfully:', response.data);
            return response.data;
        } else {
            console.warn('ML training returned non-success status:', response.status);
            return null;
        }
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.warn('ML service is not running. Skipping model training.');
        } else {
            console.error('Failed to train ML model:', error.message);
        }
        return null;
    }
};

const startMLTrainingSchedule = () => {
    // Use a longer timeout for initial health check and retry logic
    const checkMLServiceHealth = (retries = 3, delay = 2000) => {
        return new Promise((resolve, reject) => {
            const tryConnect = (attemptsLeft) => {
                axios.get(`${ML_SERVICE_URL}/health`, { 
                    timeout: 5000,
                    // Force IPv4
                    family: 4
                })
                    .then(() => {
                        console.log('✅ ML service is available at', ML_SERVICE_URL);
                        resolve(true);
                    })
                    .catch((error) => {
                        if (attemptsLeft > 0) {
                            console.log(`ML service not ready, retrying in ${delay}ms... (${attemptsLeft} attempts left)`);
                            setTimeout(() => tryConnect(attemptsLeft - 1), delay);
                        } else {
                            console.warn('❌ ML service health check failed after all retries:', error.message);
                            reject(error);
                        }
                    });
            };
            tryConnect(retries);
        });
    };

    // Check ML service with retries
    checkMLServiceHealth(3, 2000)
        .then(() => {
            // Train immediately on startup
            trainMLModel();
            
            // Schedule training every 24 hours
            setInterval(() => {
                trainMLModel();
            }, 24 * 60 * 60 * 1000);
        })
        .catch((error) => {
            console.log('⚠️  ML training schedule will not be started');
            console.log('   Reason:', error.code === 'ECONNREFUSED' ? 'ML service is not running' : error.message);
            console.log('   The application will continue with fallback recommendations.');
        });
};

module.exports = { trainMLModel, startMLTrainingSchedule };
