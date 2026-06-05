const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Agregamos 'db' a las extensiones que Metro debe reconocer
config.resolver.assetExts.push('db');

module.exports = config;