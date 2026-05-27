import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "./prisma";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value?.toLowerCase();

        console.log(`[Auth] Google OAuth callback — googleId: ${googleId}, email: ${email}`);

        if (!email) return done(new Error("No email returned from Google"));

        // 1. Try to find user by googleId (fastest, most accurate)
        let user = await prisma.user.findUnique({ where: { googleId } });
        console.log(`[Auth] Lookup by googleId: ${user ? `found user ${user.id} (${user.email})` : "not found"}`);

        if (!user) {
          // 2. Try to find by email (account linking — user signed up with email/password)
          user = await prisma.user.findUnique({ where: { email } });
          console.log(`[Auth] Lookup by email: ${user ? `found user ${user.id}` : "not found"}`);

          if (user) {
            // Link the Google ID to the existing account
            user = await prisma.user.update({
              where: { id: user.id },
              data: { googleId, isVerified: true },
            });
            console.log(`[Auth] Linked googleId to existing user ${user.id}`);
          } else {
            // 3. New user — create account
            const rawName = profile.displayName ?? email.split("@")[0];
            const username = rawName.replace(/\s+/g, "").slice(0, 30) || "user";
            user = await prisma.user.create({
              data: { email, googleId, username, password: null, isVerified: true },
            });
            console.log(`[Auth] Created new user ${user.id} for email ${email}`);
          }
        }

        console.log(`[Auth] Authenticating as user ${user.id} (${user.email})`);
        return done(null, user);
      } catch (err) {
        console.error("[Auth] Passport Google strategy error:", err);
        return done(err as Error);
      }
    }
  )
);

passport.serializeUser((user: Express.User, done) => {
  done(null, (user as { id: string }).id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;
