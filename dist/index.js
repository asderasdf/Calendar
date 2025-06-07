var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  events: () => events,
  insertEventSchema: () => insertEventSchema,
  insertSystemSettingsSchema: () => insertSystemSettingsSchema,
  insertUserSchema: () => insertUserSchema,
  systemSettings: () => systemSettings,
  users: () => users
});
import {
  pgTable,
  text,
  serial,
  integer,
  time,
  boolean,
  timestamp
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  // Changed username to email
  password: text("password").notNull(),
  name: text("name").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resetToken: text("reset_token"),
  resetTokenExpiry: text("reset_token_expiry"),
  // تغيير من date إلى text
  emailVerified: boolean("email_verified").default(false),
  verificationToken: text("verification_token"),
  lastLogin: timestamp("last_login"),
  accountLocked: boolean("account_locked").default(false),
  lockReason: text("lock_reason")
});
var insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  name: true,
  isAdmin: true,
  emailVerified: true,
  verificationToken: true,
  accountLocked: true,
  lockReason: true
});
var events = pgTable("events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  hijriDay: integer("hijri_day"),
  hijriMonth: integer("hijri_month"),
  hijriYear: integer("hijri_year"),
  gregorianDay: integer("gregorian_day"),
  gregorianMonth: integer("gregorian_month"),
  gregorianYear: integer("gregorian_year"),
  eventTime: time("event_time"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  maintenanceMode: boolean("maintenance_mode").default(false).notNull(),
  maintenanceMessage: text("maintenance_message"),
  privacyPolicy: text("privacy_policy"),
  termsOfService: text("terms_of_service"),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  updatedBy: integer("updated_by").references(() => users.id)
});
var insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true
});
var insertSystemSettingsSchema = createInsertSchema(
  systemSettings
).omit({
  id: true,
  lastUpdated: true
});

// server/storage.ts
import session from "express-session";
import connectPg from "connect-pg-simple";

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import "dotenv/config";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
    // مهم لـ Neon 
  }
});
var db = drizzle(pool, { schema: schema_exports });

// server/storage.ts
import { eq, desc, sql } from "drizzle-orm";
var PostgresSessionStore = connectPg(session);
var DatabaseStorage = class {
  sessionStore;
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: "user_sessions"
    });
  }
  async createEvent(eventData) {
    try {
      const [event] = await db.insert(events).values(eventData).returning();
      return event;
    } catch (error) {
      console.error("\u062E\u0637\u0623 \u0641\u064A \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629:", error);
      throw error;
    }
  }
  async getUser(id) {
    try {
      const [user] = await db.select({
        id: users.id,
        email: users.email,
        password: users.password,
        name: users.name,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
        resetToken: users.resetToken,
        resetTokenExpiry: users.resetTokenExpiry,
        verificationToken: users.verificationToken,
        lastLogin: sql`NULL`.as(),
        accountLocked: sql`FALSE`.as(),
        lockReason: sql`NULL`.as()
      }).from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645:", error);
      return void 0;
    }
  }
  async deleteEvent(eventId) {
    try {
      const result = await db.delete(events).where(eq(events.id, eventId)).returning({ id: events.id });
      return result.length > 0;
    } catch (error) {
      console.error("\u062E\u0637\u0623 \u0641\u064A \u062D\u0630\u0641 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629:", error);
      return false;
    }
  }
  async updateEvent(eventId, updateData) {
    try {
      const [updated] = await db.update(events).set(updateData).where(eq(events.id, eventId)).returning();
      return updated;
    } catch (error) {
      console.error("\u062E\u0637\u0623 \u0641\u064A \u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629:", error);
      return void 0;
    }
  }
  async getUserByEmail(email) {
    try {
      const [user] = await db.select({
        id: users.id,
        email: users.email,
        password: users.password,
        name: users.name,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
        resetToken: users.resetToken,
        resetTokenExpiry: users.resetTokenExpiry,
        verificationToken: users.verificationToken,
        lastLogin: sql`NULL`.as(),
        accountLocked: sql`FALSE`.as(),
        lockReason: sql`NULL`.as()
      }).from(users).where(eq(users.email, email));
      return user;
    } catch (error) {
      console.error("\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0628\u0648\u0627\u0633\u0637\u0629 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A:", error);
      return void 0;
    }
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async getAllUsers() {
    try {
      return await db.select({
        id: users.id,
        email: users.email,
        password: users.password,
        name: users.name,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
        resetToken: users.resetToken,
        resetTokenExpiry: users.resetTokenExpiry,
        verificationToken: users.verificationToken,
        lastLogin: sql`NULL`.as(),
        accountLocked: sql`FALSE`.as(),
        lockReason: sql`NULL`.as()
      }).from(users);
    } catch (error) {
      console.error("\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646:", error);
      return [];
    }
  }
  async setResetToken(email, token, expiryDate) {
    try {
      const formattedDate = expiryDate.toISOString();
      const result = await db.update(users).set({ resetToken: token, resetTokenExpiry: formattedDate }).where(eq(users.email, email)).returning({ id: users.id });
      return result.length > 0;
    } catch (error) {
      console.error("\u062E\u0637\u0623 \u0639\u0646\u062F \u062A\u0639\u064A\u064A\u0646 \u0631\u0645\u0632 \u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631:", error);
      return false;
    }
  }
  async getUserByResetToken(token) {
    try {
      const today = /* @__PURE__ */ new Date();
      const [user] = await db.select().from(users).where(eq(users.resetToken, token));
      if (user && user.resetTokenExpiry) {
        const expiryDate = new Date(user.resetTokenExpiry);
        if (expiryDate > today) return user;
      }
      return void 0;
    } catch (error) {
      console.error("\u062E\u0637\u0623 \u0639\u0646\u062F \u0627\u0644\u0628\u062D\u062B \u0639\u0646 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0628\u0631\u0645\u0632 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0639\u064A\u064A\u0646:", error);
      return void 0;
    }
  }
  async updateUserPassword(userId, newPassword) {
    try {
      const result = await db.update(users).set({ password: newPassword }).where(eq(users.id, userId)).returning({ id: users.id });
      return result.length > 0;
    } catch (error) {
      console.error("\u062E\u0637\u0623 \u0639\u0646\u062F \u062A\u062D\u062F\u064A\u062B \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631:", error);
      return false;
    }
  }
  async clearResetToken(userId) {
    try {
      const result = await db.update(users).set({ resetToken: null, resetTokenExpiry: null }).where(eq(users.id, userId)).returning({ id: users.id });
      return result.length > 0;
    } catch (error) {
      console.error("\u062E\u0637\u0623 \u0639\u0646\u062F \u0645\u0633\u062D \u0631\u0645\u0632 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0639\u064A\u064A\u0646:", error);
      return false;
    }
  }
  async updateUser(userId, userData) {
    try {
      const result = await db.update(users).set(userData).where(eq(users.id, userId)).returning({ id: users.id });
      return result.length > 0;
    } catch (error) {
      console.error("\u062E\u0637\u0623 \u0641\u064A \u062A\u062D\u062F\u064A\u062B \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645:", error);
      return false;
    }
  }
  async deleteUser(userId) {
    try {
      const result = await db.delete(users).where(eq(users.id, userId)).returning({ id: users.id });
      return result.length > 0;
    } catch (error) {
      console.error("\u062E\u0637\u0623 \u0641\u064A \u062D\u0630\u0641 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645:", error);
      return false;
    }
  }
  async setLastLogin(userId) {
    try {
      const result = await db.update(users).set({ lastLogin: sql`CURRENT_TIMESTAMP` }).where(eq(users.id, userId)).returning({ id: users.id });
      return result.length > 0;
    } catch (error) {
      console.error("\u062E\u0637\u0623 \u0641\u064A \u062A\u062D\u062F\u064A\u062B \u0648\u0642\u062A \u0622\u062E\u0631 \u062A\u0633\u062C\u064A\u0644 \u062F\u062E\u0648\u0644:", error);
      return false;
    }
  }
  async lockUserAccount(userId, reason) {
    try {
      const result = await db.update(users).set({ accountLocked: true, lockReason: reason || null }).where(eq(users.id, userId)).returning({ id: users.id });
      return result.length > 0;
    } catch (error) {
      console.error("\u062E\u0637\u0623 \u0641\u064A \u0642\u0641\u0644 \u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645:", error);
      return false;
    }
  }
  async unlockUserAccount(userId) {
    try {
      const result = await db.update(users).set({ accountLocked: false, lockReason: null }).where(eq(users.id, userId)).returning({ id: users.id });
      return result.length > 0;
    } catch (error) {
      console.error("\u062E\u0637\u0623 \u0641\u064A \u0625\u0644\u063A\u0627\u0621 \u0642\u0641\u0644 \u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645:", error);
      return false;
    }
  }
  async getUserEvents(userId) {
    try {
      return await db.select().from(events).where(eq(events.userId, userId)).orderBy(desc(events.createdAt));
    } catch (error) {
      console.error("\u062E\u0637\u0623 \u0641\u064A \u0627\u0633\u062A\u0631\u062C\u0627\u0639 \u0645\u0646\u0627\u0633\u0628\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645:", error);
      return [];
    }
  }
  async getEventById(eventId) {
    try {
      const [event] = await db.select().from(events).where(eq(events.id, eventId));
      return event;
    } catch (error) {
      console.error("\u062E\u0637\u0623 \u0641\u064A \u0627\u0633\u062A\u0631\u062C\u0627\u0639 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629:", error);
      return void 0;
    }
  }
  async getAllEvents() {
    try {
      return await db.select().from(events).orderBy(desc(events.createdAt));
    } catch (error) {
      console.error("\u062E\u0637\u0623 \u0641\u064A \u0627\u0633\u062A\u0631\u062C\u0627\u0639 \u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0627\u062A:", error);
      return [];
    }
  }
  async getSystemSettings() {
    try {
      const [settings] = await db.select().from(systemSettings).orderBy(desc(systemSettings.lastUpdated)).limit(1);
      return settings;
    } catch (error) {
      console.error("\u062E\u0637\u0623 \u0641\u064A \u0627\u0633\u062A\u0631\u062C\u0627\u0639 \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645:", error);
      return void 0;
    }
  }
  async updateSystemSettings(settings, updatedBy) {
    try {
      const currentSettings = await this.getSystemSettings();
      if (currentSettings) {
        const result = await db.update(systemSettings).set({ ...settings, updatedBy, lastUpdated: sql`CURRENT_TIMESTAMP` }).where(eq(systemSettings.id, currentSettings.id)).returning({ id: systemSettings.id });
        return result.length > 0;
      } else {
        const [newSettings] = await db.insert(systemSettings).values({ ...settings, updatedBy, lastUpdated: /* @__PURE__ */ new Date() }).returning({ id: systemSettings.id });
        return !!newSettings;
      }
    } catch (error) {
      console.error("\u062E\u0637\u0623 \u0641\u064A \u062A\u062D\u062F\u064A\u062B \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645:", error);
      return false;
    }
  }
  async setMaintenanceMode(enabled, message, updatedBy) {
    try {
      return this.updateSystemSettings(
        { maintenanceMode: enabled, maintenanceMessage: message },
        updatedBy
      );
    } catch (error) {
      console.error("\u062E\u0637\u0623 \u0641\u064A \u062A\u063A\u064A\u064A\u0631 \u0648\u0636\u0639 \u0627\u0644\u0635\u064A\u0627\u0646\u0629:", error);
      return false;
    }
  }
  async updateTermsOfService(content, updatedBy) {
    try {
      return this.updateSystemSettings({ termsOfService: content }, updatedBy);
    } catch (error) {
      console.error("\u062E\u0637\u0623 \u0641\u064A \u062A\u062D\u062F\u064A\u062B \u0634\u0631\u0648\u0637 \u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645:", error);
      return false;
    }
  }
  async updatePrivacyPolicy(content, updatedBy) {
    try {
      return this.updateSystemSettings({ privacyPolicy: content }, updatedBy);
    } catch (error) {
      console.error("\u062E\u0637\u0623 \u0641\u064A \u062A\u062D\u062F\u064A\u062B \u0633\u064A\u0627\u0633\u0629 \u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629:", error);
      return false;
    }
  }
};
var storage = new DatabaseStorage();

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session2 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function requireAuth(req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
  }
  next();
}
function setupAuth(app2) {
  const sessionSecret = process.env.SESSION_SECRET || randomBytes(32).toString("hex");
  const sessionSettings = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1e3,
      // 30 days
      httpOnly: true,
      secure: true,
      sameSite: "none"
    }
  };
  app2.set("trust proxy", 1);
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !await comparePasswords(password, user.password)) {
            return done(null, false, {
              message: "\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0623\u0648 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631"
            });
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
  app2.post("/api/register", async (req, res, next) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: "\u064A\u0631\u062C\u0649 \u062A\u0639\u0628\u0626\u0629 \u062C\u0645\u064A\u0639 \u0627\u0644\u062D\u0642\u0648\u0644" });
    }
    try {
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0645\u0633\u062A\u062E\u062F\u0645 \u0628\u0627\u0644\u0641\u0639\u0644" });
      }
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        name,
        isAdmin: false,
        verificationToken: null
      });
      const { password: _, ...safeUser } = user;
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(201).json(safeUser);
      });
    } catch (err) {
      console.error("Registration error:", err);
      return res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u062A\u0633\u062C\u064A\u0644" });
    }
  });
  app2.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({
          message: info?.message || "\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0623\u0648 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631"
        });
      }
      req.login(user, (err2) => {
        if (err2) return next(err2);
        const { password, ...safeUser } = user;
        return res.json(safeUser);
      });
    })(req, res, next);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
    }
    const { password, ...safeUser } = req.user;
    res.json(safeUser);
  });
  app2.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643 \u0628\u0627\u0644\u0648\u0635\u0648\u0644" });
    }
    try {
      const allUsers = await storage.getAllUsers();
      const safeUsers = allUsers.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (err) {
      console.error("Error fetching users:", err);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062C\u0644\u0628 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646" });
    }
  });
}

// server/ummAlQuraCalendar.ts
var getHijriMonthName = (month) => {
  const hijriMonths = [
    "\u0645\u062D\u0631\u0645",
    "\u0635\u0641\u0631",
    "\u0631\u0628\u064A\u0639 \u0627\u0644\u0623\u0648\u0644",
    "\u0631\u0628\u064A\u0639 \u0627\u0644\u062B\u0627\u0646\u064A",
    "\u062C\u0645\u0627\u062F\u0649 \u0627\u0644\u0623\u0648\u0644\u0649",
    "\u062C\u0645\u0627\u062F\u0649 \u0627\u0644\u0622\u062E\u0631\u0629",
    "\u0631\u062C\u0628",
    "\u0634\u0639\u0628\u0627\u0646",
    "\u0631\u0645\u0636\u0627\u0646",
    "\u0634\u0648\u0627\u0644",
    "\u0630\u0648 \u0627\u0644\u0642\u0639\u062F\u0629",
    "\u0630\u0648 \u0627\u0644\u062D\u062C\u0629"
  ];
  return hijriMonths[month - 1] || "";
};
var getGregorianMonthName = (month) => {
  const gregorianMonths = [
    "\u064A\u0646\u0627\u064A\u0631",
    "\u0641\u0628\u0631\u0627\u064A\u0631",
    "\u0645\u0627\u0631\u0633",
    "\u0623\u0628\u0631\u064A\u0644",
    "\u0645\u0627\u064A\u0648",
    "\u064A\u0648\u0646\u064A\u0648",
    "\u064A\u0648\u0644\u064A\u0648",
    "\u0623\u063A\u0633\u0637\u0633",
    "\u0633\u0628\u062A\u0645\u0628\u0631",
    "\u0623\u0643\u062A\u0648\u0628\u0631",
    "\u0646\u0648\u0641\u0645\u0628\u0631",
    "\u062F\u064A\u0633\u0645\u0628\u0631"
  ];
  return gregorianMonths[month - 1] || "";
};
var getArabicDayName = (day) => {
  const weekDays = [
    "\u0627\u0644\u0623\u062D\u062F",
    "\u0627\u0644\u0625\u062B\u0646\u064A\u0646",
    "\u0627\u0644\u062B\u0644\u0627\u062B\u0627\u0621",
    "\u0627\u0644\u0623\u0631\u0628\u0639\u0627\u0621",
    "\u0627\u0644\u062E\u0645\u064A\u0633",
    "\u0627\u0644\u062C\u0645\u0639\u0629",
    "\u0627\u0644\u0633\u0628\u062A"
  ];
  return weekDays[day] || "";
};
var hijriMonthLengths = {
  1: 30,
  // Muharram
  2: 29,
  // Safar
  3: 30,
  // Rabi' al-awwal
  4: 29,
  // Rabi' al-thani
  5: 30,
  // Jumada al-awwal
  6: 29,
  // Jumada al-thani
  7: 30,
  // Rajab
  8: 29,
  // Sha'ban
  9: 30,
  // Ramadan
  10: 29,
  // Shawwal
  11: 30,
  // Dhu al-Qi'dah
  12: 29
  // Dhu al-Hijjah
};
var referenceDate = {
  hijri: { day: 15, month: 11, year: 1446 },
  // 15 Dhu al-Qi'dah 1446
  gregorian: { day: 13, month: 5, year: 2025 }
  // May 13, 2025
};
function getUmmAlQuraToday() {
  const today = /* @__PURE__ */ new Date();
  const gDay = today.getDate();
  const gMonth = today.getMonth() + 1;
  const gYear = today.getFullYear();
  const weekDay = today.getDay();
  const hijriDate = estimateHijriFromGregorian(gDay, gMonth, gYear);
  return {
    hijriDay: hijriDate.day,
    hijriMonth: hijriDate.month,
    hijriYear: hijriDate.year,
    gregorianDay: gDay,
    gregorianMonth: gMonth,
    gregorianYear: gYear,
    hijriMonthName: getHijriMonthName(hijriDate.month),
    gregorianMonthName: getGregorianMonthName(gMonth),
    weekDay,
    weekDayName: getArabicDayName(weekDay)
  };
}
function estimateGregorianFromHijri(hijriDay, hijriMonth, hijriYear) {
  const monthsDiff = (hijriYear - referenceDate.hijri.year) * 12 + (hijriMonth - referenceDate.hijri.month);
  let daysDiff = hijriDay - referenceDate.hijri.day;
  if (monthsDiff > 0) {
    for (let m = referenceDate.hijri.month; m <= 12; m++) {
      if (m !== referenceDate.hijri.month)
        daysDiff += hijriMonthLengths[m] || 30;
    }
    for (let y = referenceDate.hijri.year + 1; y < hijriYear; y++) {
      daysDiff += 354;
    }
    for (let m = 1; m < hijriMonth; m++) {
      daysDiff += hijriMonthLengths[m] || 30;
    }
  } else if (monthsDiff < 0) {
    for (let m = referenceDate.hijri.month - 1; m >= 1; m--) {
      daysDiff -= hijriMonthLengths[m] || 30;
    }
    for (let y = referenceDate.hijri.year - 1; y >= hijriYear; y--) {
      daysDiff -= 354;
    }
    for (let m = 12; m >= hijriMonth; m--) {
      daysDiff -= hijriMonthLengths[m] || 30;
    }
  }
  const date2 = new Date(
    referenceDate.gregorian.year,
    referenceDate.gregorian.month - 1,
    referenceDate.gregorian.day
  );
  date2.setDate(date2.getDate() + daysDiff);
  return {
    day: date2.getDate(),
    month: date2.getMonth() + 1,
    year: date2.getFullYear(),
    weekDay: date2.getDay()
  };
}
function estimateHijriFromGregorian(gregorianDay, gregorianMonth, gregorianYear) {
  const gregDate = new Date(gregorianYear, gregorianMonth - 1, gregorianDay);
  const refDate = new Date(
    referenceDate.gregorian.year,
    referenceDate.gregorian.month - 1,
    referenceDate.gregorian.day
  );
  const daysDiff = Math.round(
    (gregDate.getTime() - refDate.getTime()) / (1e3 * 60 * 60 * 24)
  );
  let totalDays = referenceDate.hijri.day + daysDiff;
  let year = referenceDate.hijri.year;
  let month = referenceDate.hijri.month;
  while (totalDays > hijriMonthLengths[month]) {
    totalDays -= hijriMonthLengths[month];
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
  while (totalDays <= 0) {
    month--;
    if (month < 1) {
      month = 12;
      year--;
    }
    totalDays += hijriMonthLengths[month];
  }
  return {
    day: totalDays,
    month,
    year,
    weekDay: gregDate.getDay()
  };
}
function isValidHijriDate(day, month, year) {
  if (month < 1 || month > 12) return false;
  const monthLength = hijriMonthLengths[month] || 30;
  if (day < 1 || day > monthLength) return false;
  if (year < 1400 || year > 1500) return false;
  return true;
}

// server/adminRoutes.ts
function setupAdminRoutes(app2) {
  app2.get("/api/admin/events", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0628\u0627\u0644\u0648\u0635\u0648\u0644" });
    }
    try {
      const events2 = await storage.getAllEventsWithUsers();
      events2.sort((a, b) => {
        const dateA = /* @__PURE__ */ new Date(
          `${a.date.gregorian.year}-${a.date.gregorian.month}-${a.date.gregorian.day}`
        );
        const dateB = /* @__PURE__ */ new Date(
          `${b.date.gregorian.year}-${b.date.gregorian.month}-${b.date.gregorian.day}`
        );
        return dateB.getTime() - dateA.getTime();
      });
      res.json(events2);
    } catch (error) {
      console.error("Error fetching all events:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062C\u0644\u0628 \u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0627\u062A" });
    }
  });
  app2.get("/api/admin/users", (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0628\u0627\u0644\u0648\u0635\u0648\u0644" });
    }
    storage.getAllUsers().then((users2) => res.json(users2)).catch((err) => {
      console.error("Error fetching users:", err);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062C\u0644\u0628 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646" });
    });
  });
  app2.get("/api/admin/user/:userId", (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0628\u0627\u0644\u0648\u0635\u0648\u0644" });
    }
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "\u0645\u0639\u0631\u0641 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D" });
    }
    storage.getUser(userId).then((user) => {
      if (!user) {
        return res.status(404).json({ message: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      res.json(user);
    }).catch((err) => {
      console.error("Error fetching user:", err);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062C\u0644\u0628 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645" });
    });
  });
  app2.get("/api/admin/user/:userId/events", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0628\u0627\u0644\u0648\u0635\u0648\u0644" });
    }
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "\u0645\u0639\u0631\u0641 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D" });
    }
    try {
      const events2 = await storage.getUserEvents(userId);
      res.json(events2);
    } catch (error) {
      console.error("Error fetching user events:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062C\u0644\u0628 \u0645\u0646\u0627\u0633\u0628\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645" });
    }
  });
  app2.post("/api/admin/user/:userId/lock", (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0628\u0627\u0644\u0648\u0635\u0648\u0644" });
    }
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "\u0645\u0639\u0631\u0641 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D" });
    }
    const reason = req.body.reason;
    storage.lockUserAccount(userId, reason).then((success) => {
      if (!success) {
        return res.status(404).json({ message: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0623\u0648 \u0644\u0627 \u064A\u0645\u0643\u0646 \u0642\u0641\u0644 \u0627\u0644\u062D\u0633\u0627\u0628" });
      }
      res.json({ success: true });
    }).catch((err) => {
      console.error("Error locking user account:", err);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0642\u0641\u0644 \u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645" });
    });
  });
  app2.post("/api/admin/user/:userId/unlock", (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0628\u0627\u0644\u0648\u0635\u0648\u0644" });
    }
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "\u0645\u0639\u0631\u0641 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D" });
    }
    storage.unlockUserAccount(userId).then((success) => {
      if (!success) {
        return res.status(404).json({ message: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0623\u0648 \u0644\u0627 \u064A\u0645\u0643\u0646 \u0641\u062A\u062D \u0642\u0641\u0644 \u0627\u0644\u062D\u0633\u0627\u0628" });
      }
      res.json({ success: true });
    }).catch((err) => {
      console.error("Error unlocking user account:", err);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0641\u062A\u062D \u0642\u0641\u0644 \u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645" });
    });
  });
}

// server/routes.ts
var gregorianMonthLengths = {
  1: 31,
  2: 28,
  3: 31,
  4: 30,
  5: 31,
  6: 30,
  7: 31,
  8: 31,
  9: 30,
  10: 31,
  11: 30,
  12: 31
};
var generateCalendarMonth = (year, month, isHijri) => {
  const daysInMonth = isHijri ? hijriMonthLengths[month] || 30 : gregorianMonthLengths[month] || 30;
  const dates = [];
  for (let day = 1; day <= daysInMonth; day++) {
    let hijriDate, gregorianDate, weekDay;
    if (isHijri) {
      hijriDate = { day, month, year };
      gregorianDate = estimateGregorianFromHijri(day, month, year);
      weekDay = gregorianDate.weekDay;
    } else {
      weekDay = new Date(year, month - 1, day).getDay();
      gregorianDate = { day, month, year, weekDay };
      hijriDate = estimateHijriFromGregorian(day, month, year);
    }
    dates.push({
      hijriDay: hijriDate.day,
      hijriMonth: hijriDate.month,
      hijriYear: hijriDate.year,
      gregorianDay: gregorianDate.day,
      gregorianMonth: gregorianDate.month,
      gregorianYear: gregorianDate.year,
      hijriMonthName: getHijriMonthName(hijriDate.month),
      gregorianMonthName: getGregorianMonthName(gregorianDate.month),
      weekDay,
      weekDayName: getArabicDayName(weekDay)
    });
  }
  return {
    hijriYear: isHijri ? year : dates[0].hijriYear,
    hijriMonth: isHijri ? month : dates[0].hijriMonth,
    gregorianYear: isHijri ? dates[0].gregorianYear : year,
    gregorianMonth: isHijri ? dates[0].gregorianMonth : month,
    dates,
    hijriMonthName: getHijriMonthName(isHijri ? month : dates[0].hijriMonth),
    gregorianMonthName: getGregorianMonthName(
      isHijri ? dates[0].gregorianMonth : month
    )
  };
};
async function registerRoutes(app2) {
  setupAuth(app2);
  app2.get("/api/age-calculator", (req, res) => {
    const { birthDate } = req.query;
    if (!birthDate || typeof birthDate !== "string") {
      return res.status(400).json({ message: "\u064A\u0631\u062C\u0649 \u062A\u0648\u0641\u064A\u0631 \u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0645\u064A\u0644\u0627\u062F" });
    }
    const birth = new Date(birthDate);
    const now = /* @__PURE__ */ new Date();
    if (isNaN(birth.getTime())) {
      return res.status(400).json({ message: "\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0645\u064A\u0644\u0627\u062F \u063A\u064A\u0631 \u0635\u0627\u0644\u062D" });
    }
    let gYears = now.getFullYear() - birth.getFullYear();
    let gMonths = now.getMonth() - birth.getMonth();
    let gDays = now.getDate() - birth.getDate();
    if (gDays < 0) {
      gMonths -= 1;
      gDays += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    }
    if (gMonths < 0) {
      gYears -= 1;
      gMonths += 12;
    }
    const hijriBirth = estimateHijriFromGregorian(
      birth.getDate(),
      birth.getMonth() + 1,
      birth.getFullYear()
    );
    const hijriNow = estimateHijriFromGregorian(
      now.getDate(),
      now.getMonth() + 1,
      now.getFullYear()
    );
    let hYears = hijriNow.year - hijriBirth.year;
    let hMonths = hijriNow.month - hijriBirth.month;
    let hDays = hijriNow.day - hijriBirth.day;
    if (hDays < 0) {
      hMonths -= 1;
      hDays += 30;
    }
    if (hMonths < 0) {
      hYears -= 1;
      hMonths += 12;
    }
    res.json({
      gregorianYears: gYears,
      gregorianMonths: gMonths,
      gregorianDays: gDays,
      hijriYears: hYears,
      hijriMonths: hMonths,
      hijriDays: hDays
    });
  });
  app2.get("/api/calendar/today", (req, res) => {
    try {
      const todayDate = getUmmAlQuraToday();
      res.json(todayDate);
    } catch (error) {
      console.error("Error getting today's date:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062C\u0644\u0628 \u062A\u0627\u0631\u064A\u062E \u0627\u0644\u064A\u0648\u0645" });
    }
  });
  app2.get("/api/calendar/month", (req, res) => {
    try {
      const { year, month, calendar } = req.query;
      if (!year || !month || !calendar) {
        return res.status(400).json({ message: "\u064A\u062C\u0628 \u062A\u0648\u0641\u064A\u0631 \u0627\u0644\u0633\u0646\u0629 \u0648\u0627\u0644\u0634\u0647\u0631 \u0648\u0646\u0648\u0639 \u0627\u0644\u062A\u0642\u0648\u064A\u0645" });
      }
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      const isHijri = calendar === "hijri";
      if (isNaN(yearNum) || isNaN(monthNum)) {
        return res.status(400).json({ message: "\u0627\u0644\u0633\u0646\u0629 \u0648\u0627\u0644\u0634\u0647\u0631 \u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 \u0623\u0631\u0642\u0627\u0645\u064B\u0627 \u0635\u062D\u064A\u062D\u0629" });
      }
      const calendarMonth = generateCalendarMonth(yearNum, monthNum, isHijri);
      res.json(calendarMonth);
    } catch (error) {
      console.error("Error getting calendar month:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062C\u0644\u0628 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0634\u0647\u0631" });
    }
  });
  app2.get("/api/calendar/convert", (req, res) => {
    try {
      const { year, month, day, from } = req.query;
      if (!year || !month || !day) {
        return res.status(400).json({ message: "\u064A\u062C\u0628 \u062A\u0648\u0641\u064A\u0631 \u0627\u0644\u0633\u0646\u0629 \u0648\u0627\u0644\u0634\u0647\u0631 \u0648\u0627\u0644\u064A\u0648\u0645" });
      }
      const fromCalendar = from || "gregorian";
      const isFromHijri = fromCalendar === "hijri";
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      const dayNum = parseInt(day);
      if (isNaN(yearNum) || isNaN(monthNum) || isNaN(dayNum)) {
        return res.status(400).json({ message: "\u0627\u0644\u0633\u0646\u0629 \u0648\u0627\u0644\u0634\u0647\u0631 \u0648\u0627\u0644\u064A\u0648\u0645 \u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 \u0623\u0631\u0642\u0627\u0645\u064B\u0627 \u0635\u062D\u064A\u062D\u0629" });
      }
      let hijriDay, hijriMonth, hijriYear;
      let gregorianDay, gregorianMonth, gregorianYear;
      let weekDay;
      if (isFromHijri) {
        hijriDay = dayNum;
        hijriMonth = monthNum;
        hijriYear = yearNum;
        const gregorianDate = estimateGregorianFromHijri(
          dayNum,
          monthNum,
          yearNum
        );
        gregorianDay = gregorianDate.day;
        gregorianMonth = gregorianDate.month;
        gregorianYear = gregorianDate.year;
        weekDay = gregorianDate.weekDay;
      } else {
        gregorianDay = dayNum;
        gregorianMonth = monthNum;
        gregorianYear = yearNum;
        weekDay = new Date(yearNum, monthNum - 1, dayNum).getDay();
        const hijriDate = estimateHijriFromGregorian(dayNum, monthNum, yearNum);
        hijriDay = hijriDate.day;
        hijriMonth = hijriDate.month;
        hijriYear = hijriDate.year;
      }
      res.json({
        hijriDay,
        hijriMonth,
        hijriYear,
        gregorianDay,
        gregorianMonth,
        gregorianYear,
        hijriMonthName: getHijriMonthName(hijriMonth),
        gregorianMonthName: getGregorianMonthName(gregorianMonth),
        weekDay,
        weekDayName: getArabicDayName(weekDay)
      });
    } catch (error) {
      console.error("Error converting date:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062A\u062D\u0648\u064A\u0644 \u0627\u0644\u062A\u0627\u0631\u064A\u062E" });
    }
  });
  app2.get("/api/categories", (req, res) => {
    const categories = [
      { id: "all", name: "\u0627\u0644\u0643\u0644", default: true },
      { id: "1", name: "\u0623\u0639\u064A\u0627\u062F", color: "green" },
      { id: "2", name: "\u0645\u0646\u0627\u0633\u0628\u0627\u062A \u0634\u062E\u0635\u064A\u0629", color: "purple" },
      { id: "3", name: "\u0645\u0648\u0627\u0639\u064A\u062F \u0637\u0628\u064A\u0629", color: "red" },
      { id: "4", name: "\u0623\u0639\u0645\u0627\u0644", color: "orange" },
      { id: "5", name: "\u0633\u0641\u0631", color: "teal" }
    ];
    res.json(categories);
  });
  const defaultEvents = [
    {
      id: 1,
      title: "\u0639\u064A\u062F \u0627\u0644\u0641\u0637\u0631",
      days: 3,
      date: {
        hijri: { day: 1, month: 10, year: 1444, formatted: "01/10/1444" },
        gregorian: { day: 10, month: 4, year: 2023, formatted: "10/04/2023" }
      },
      color: "green",
      categoryId: "1"
    },
    {
      id: 2,
      title: "\u0639\u064A\u062F \u0627\u0644\u0623\u0636\u062D\u0649",
      days: 4,
      date: {
        hijri: { day: 10, month: 12, year: 1444, formatted: "10/12/1444" },
        gregorian: { day: 17, month: 6, year: 2023, formatted: "17/06/2023" }
      },
      color: "green",
      categoryId: "1"
    }
    // يمكن إضافة مناسبات أخرى هنا
  ];
  app2.get("/api/events", async (req, res) => {
    try {
      const userEvents = await storage.getAllEvents();
      const events2 = [...userEvents, ...defaultEvents];
      res.json(events2);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062C\u0644\u0628 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0627\u062A" });
    }
  });
  app2.post("/api/events", requireAuth, async (req, res) => {
    try {
      const { title, days, date: date2, time: time2 } = req.body;
      if (!title || !days || !date2?.hijriDay || !date2?.hijriMonth || !date2?.hijriYear || !date2?.gregorianDay || !date2?.gregorianMonth || !date2?.gregorianYear) {
        return res.status(400).json({ message: "\u0628\u064A\u0627\u0646\u0627\u062A \u063A\u064A\u0631 \u0645\u0643\u062A\u0645\u0644\u0629 \u0644\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629" });
      }
      const event = await storage.createEvent({
        title,
        days,
        userId: req.user.id,
        hijri_day: date2.hijriDay,
        hijri_month: date2.hijriMonth,
        hijri_year: date2.hijriYear,
        gregorian_day: date2.gregorianDay,
        gregorian_month: date2.gregorianMonth,
        gregorian_year: date2.gregorianYear,
        event_time: time2
        // مثال: "14:30"
      });
      res.status(201).json(event);
    } catch (error) {
      console.error("\u062E\u0637\u0623 \u0641\u064A \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629" });
    }
  });
  app2.delete("/api/events/:id", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "\u0645\u0639\u0631\u0641 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D" });
      }
      await storage.deleteEvent(eventId);
      res.json({ message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629 \u0628\u0646\u062C\u0627\u062D" });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062D\u0630\u0641 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629" });
    }
  });
  app2.put("/api/events/:id", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const updateData = req.body;
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "\u0645\u0639\u0631\u0641 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D" });
      }
      if (updateData.date?.hijri && !isValidHijriDate(
        updateData.date.hijri.day,
        updateData.date.hijri.month,
        updateData.date.hijri.year
      )) {
        return res.status(400).json({ message: "\u062A\u0627\u0631\u064A\u062E \u0647\u062C\u0631\u064A \u063A\u064A\u0631 \u0635\u0627\u0644\u062D" });
      }
      const updatedEvent = await storage.updateEvent(eventId, updateData);
      res.json(updatedEvent);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629" });
    }
  });
  app2.post("/api/users/register", async (req, res) => {
    try {
      const data = req.body;
      if (!data.username || !data.password) {
        return res.status(400).json({ message: "\u064A\u062C\u0628 \u062A\u0648\u0641\u064A\u0631 \u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0648\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" });
      }
      data.password = await hashPassword(data.password);
      const user = await storage.users.create(data);
      res.status(201).json({ message: "\u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0628\u0646\u062C\u0627\u062D", user });
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645" });
    }
  });
  app2.post("/api/users/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "\u064A\u062C\u0628 \u062A\u0648\u0641\u064A\u0631 \u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0648\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" });
      }
      const user = await storage.users.findByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      const isPasswordValid = await storage.users.verifyPassword(
        user,
        password
      );
      if (!isPasswordValid) {
        return res.status(401).json({ message: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629" });
      }
      const token = await storage.sessions.create(user.id);
      res.json({ message: "\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0628\u0646\u062C\u0627\u062D", token });
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644" });
    }
  });
  setupAdminRoutes(app2);
  return createServer(app2);
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { dirname as dirname2 } from "path";
import { createServer as createViteServer, createLogger } from "vite";

// client/vite.config.ts
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  base: "./",
  // ✅ ضروري للإنتاج على Render
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@shared": resolve(__dirname, "shared"),
      "@assets": resolve(__dirname, "attached_assets")
    }
  },
  server: {
    port: 3e3,
    proxy: {
      "/api": "https://cleander-project-server.onrender.com"
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    if (req.originalUrl.startsWith("/api")) return next();
    const url = req.originalUrl;
    try {
      const clientTemplate = path.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.get("*", (req, res, next) => {
    if (req.originalUrl.startsWith("/api")) return next();
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import "dotenv/config";
import cors from "cors";
var app = express2();
var allowedOrigins = [
  "https://cleander-project-front.onrender.com",
  "https://cleander-project-server.onrender.com",
  "http://localhost:3000"
];
console.log("\u2705 Allowed CORS Origins:", allowedOrigins);
app.use(
  cors({
    origin: (origin, callback) => {
      console.log("\u{1F50D} Request Origin:", origin);
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("\u26D4 Blocked by CORS:", origin);
        callback(null, false);
      }
    },
    credentials: true
  })
);
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
setupAuth(app);
app.use((req, res, next) => {
  const start = Date.now();
  const path2 = req.path;
  let capturedJsonResponse;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path2.startsWith("/api")) {
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const port = process.env.PORT || 5e3;
  let server;
  server = await registerRoutes(app);
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error("\u{1F525} Unhandled Error:", err);
  });
  server.listen(
    {
      port: Number(port),
      host: "0.0.0.0"
    },
    () => {
      log(`\u{1F680} Server running on http://0.0.0.0:${port}`);
    }
  );
})();
