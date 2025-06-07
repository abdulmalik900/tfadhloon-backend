// Socket instance utility to share io instance across the application
let ioInstance = null;

export const setSocketInstance = (io) => {
  ioInstance = io;
};

export const getSocketInstance = () => {
  return ioInstance;
};
