import mongoose from "mongoose";
import { verifyAccessToken } from "../utils/jwt.js";
import admin from "../configs/firebaseAdmin.js";
import Role from "../models/role/role.model.js";

export const ROLES = {
  STUDENT: "student",
  INSTRUCTOR: "instructor",
  ADMIN: "admin",
  SUPERADMIN: "superadmin",
};

export async function authenticate(req, res, next) {
  try {
    let token = null;

    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token && req.cookies?.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      return res.status(401).json({ success: false });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    req.user = {
      id: decoded.id,
      roleId: decoded.roleId,
      active_role: decoded.active_role || decoded.role || null,
      permissions: decoded.permissions || [],
    };

    next();
  } catch {
    return res.status(403).json({
      success: false,
      message: "Invalid token",
    });
  }
}
export function optionalAuthenticate(req, res, next) {
  try {
    let token = null;

    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token && req.cookies?.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = verifyAccessToken(token);

    req.user = decoded
      ? {
          id: decoded.id,
          roleId: decoded.roleId,
          active_role: decoded.active_role || decoded.role || null,
          permissions: decoded.permissions || [],
        }
      : null;

    next();
  } catch {
    req.user = null;
    next();
  }
}

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
    }

    const role = req.user.active_role;

    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Access denied",
      });
    }

    next();
  };
}

export function authorizePermission(...requiredPermissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userPermissions = req.user.permissions || [];

    if (userPermissions.includes("*")) return next();

    const hasPermission = requiredPermissions.every((perm) => {
      if (userPermissions.includes(perm)) return true;

      const moduleWildcard = perm.split(".")[0] + ".*";
      return userPermissions.includes(moduleWildcard);
    });

    if (!hasPermission) {
      return res.status(403).json({ message: "Permission denied" });
    }

    next();
  };
}

export const isInstructor = authorize(ROLES.INSTRUCTOR);
export const isAdmin = authorize(ROLES.ADMIN);

export async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      code: "FIREBASE_TOKEN_MISSING",
      message: "No Firebase token provided",
    });
  }

  try {
    const idToken = authHeader.split(" ")[1];
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.firebaseUser = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      code: "FIREBASE_TOKEN_INVALID",
      message: "Invalid Firebase token",
    });
  }
}

export async function noCompression(req, res, next) {
  res.set("Content-Encoding", "identity");
  next();
}
export const attachPermissions = async (req, res, next) => {
  try {
    const roleId = req.user.roleId;

    if (!roleId || !mongoose.Types.ObjectId.isValid(roleId)) {
      return res.status(400).json({ message: "Invalid roleId in token" });
    }

    const role = await Role.findById(roleId).lean();

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    req.permissions = role.permissions || [];

    next();
  } catch (err) {
    console.error("attachPermissions error:", err);
    return res.status(500).json({
      success: false,
      message: "Permission load failed",
    });
  }
};
