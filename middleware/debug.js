/**
 * Middleware debug đơn giản - hiện đã vô hiệu hóa
 */

const { writeToLogFile, isStaticResource } = require('./logger');

/**
 * Debug middleware đã vô hiệu hóa
 */
const debugRender = (req, res, next) => {
  // Bỏ qua middleware này
  next();
};

/**
 * Debug middleware cho thời gian thực thi - đã vô hiệu hóa
 */
const requestTimer = (req, res, next) => {
  // Bỏ qua middleware này
  next();
};

/**
 * Debug middleware cho request headers - đã vô hiệu hóa
 */
const debugHeaders = (req, res, next) => {
  // Bỏ qua middleware này
  next();
};

module.exports = {
  debugRender,
  requestTimer,
  debugHeaders
}; 