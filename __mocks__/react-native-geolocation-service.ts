const Geolocation = {
  getCurrentPosition: (_success: (position: { coords: { latitude: number; longitude: number } }) => void, error?: () => void) => {
    error?.();
  },
};

export default Geolocation;
