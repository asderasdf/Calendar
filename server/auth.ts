import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Express } from 'express';
import session from 'express-session';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { storage } from './storage';
import { User as SelectUser } from '@shared/schema';

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
export function requireAuth(req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: 'غير مصرح' });
  }
  next();
}

// middleware للتحقق من صلاحيات المدير
export function isAdmin(req: any, res: any, next: any) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: 'يجب تسجيل الدخول أولاً' });
  }

  if (!req.user || !req.user.isAdmin) {
    return res
      .status(403)
      .json({ message: 'غير مصرح لك بالوصول إلى هذه الصفحة' });
  }

  next();
}

export function setupAuth(app: Express) {
  const sessionSecret =
    process.env.SESSION_SECRET || randomBytes(32).toString('hex');

  const isProduction = process.env.NODE_ENV === 'production';

  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: isProduction, // فقط في الإنتاج
      sameSite: isProduction ? 'none' : 'lax', // none فقط مع secure: true
    },
  };

  if (isProduction) {
    app.set('trust proxy', 1); // إذا خلف proxy مثل Heroku أو nginx
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false, {
              message: 'خطأ في البريد الإلكتروني أو كلمة المرور',
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

  passport.deserializeUser(async (id: number, done) => {
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



  // Registration endpoint
  app.post('/api/register', async (req, res, next) => {
  const { email, password, name, isAdmin } = req.body; // ← أضف isAdmin هنا

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'يرجى تعبئة جميع الحقول' });
  }

  try {
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res
        .status(400)
        .json({ message: 'البريد الإلكتروني مستخدم بالفعل' });
    }

    const hashedPassword = await hashPassword(password);
    const user = await storage.createUser({
      email,
      password: hashedPassword,
      name,
      isAdmin: !!isAdmin, // ← اجعلها ديناميكية
      verificationToken: null,
    });

    const { password: _, ...safeUser } = user;

    req.login(user, (err) => {
      if (err) return next(err);
      return res.status(201).json(safeUser);
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ message: 'حدث خطأ أثناء التسجيل' });
  }
});

  // Login endpoint
  app.post('/api/login', (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({
          message: info?.message || 'خطأ في البريد الإلكتروني أو كلمة المرور',
        });
      }

      // ✅ تم حذف شرط التحقق من البريد الإلكتروني

      req.login(user, (err) => {
        if (err) return next(err);
        const { password, ...safeUser } = user;
        return res.json(safeUser);
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post('/api/logout', (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Current user endpoint
  app.get('/api/user', (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'غير مصرح' });
    }
    const { password, ...safeUser } = req.user;
    res.json(safeUser);
  });

  // Admin users list endpoint (protected)
  app.get('/api/admin/users', async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: 'غير مصرح لك بالوصول' });
    }
    try {
      const allUsers = await storage.getAllUsers();
      const safeUsers = allUsers.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      res.status(500).json({ message: 'حدث خطأ أثناء جلب المستخدمين' });
    }
  });
}
