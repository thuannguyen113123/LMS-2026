import { jwtConfig } from "../configs/config";

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Authentication required"));

  try {
    const decoded = jwt.verify(token, jwtConfig.accessTokenSecret);

    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});
