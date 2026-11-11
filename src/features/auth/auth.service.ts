import { OAuth2Client } from "google-auth-library"
import { env } from '@/config/env'
import { PrismaService } from '@/shared/database/prisma.service'

export type GoogleUserPayload = {
  googleSubject: string
  email: string
  fullName: string
}

export class AuthService {
  private readonly googleClient: OAuth2Client

  constructor(private readonly prisma: PrismaService) {
    this.googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID)
  }

  public async verifyGoogleToken(idToken : string): Promise<GoogleUserPayload> {
    const ticket = await this.googleClient.verifyIdToken({idToken,audience: env.GOOGLE_CLIENT_ID})

    const payload = ticket.getPayload()

    if (!payload) {
      throw new Error('Invalid Google ID Token Received')
    }

    //checks if any are null or email or hd is not dlsu.edu.ph
    if (!payload.email || !payload.email_verified ||
      payload.email.split('@')[1] !== 'dlsu.edu.ph' || payload.hd !== 'dlsu.edu.ph') {
      throw new Error('Unauthorized Google Account - Not From DLSU')
    }

    if (!payload.sub || !payload.name) {
      throw new Error('Google Account is missing required Information')
    }

    return {
      googleSubject: payload.sub,
      email: payload.email,
      fullName: payload.name,
    }
  }

  public async findOrCreateUser(googleUser: GoogleUserPayload) {
    const user = await this.prisma.user.upsert({
      where: {
        googleSubject: googleUser.googleSubject,
      },
      update: {},
      create: {
        googleSubject: googleUser.googleSubject,
        email: googleUser.email,
        fullName, googleUser.fullName,
      },
    })
  }
}
