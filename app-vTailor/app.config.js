/** @type {import('expo/config').ConfigContext} */
module.exports = ({ config }) => {
  const googleMapsApiKey =
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    '';

  return {
    ...config,
    android: {
      ...config.android,
      adaptiveIcon: {
        foregroundImage: './assets/images/vTailorlogo.png',
        backgroundColor: '#E6F4FE',
      },
      config: {
        ...config.android?.config,
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
    plugins: [
      ...(config.plugins ?? []),
      [
        'expo-notifications',
        {
          color: '#E6F4FE',
        },
      ],
    ],
  };
};
