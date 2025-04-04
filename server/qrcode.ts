import { storage } from './storage';
import crypto from 'crypto';

// Map to store generated QR tokens and their expiration times
const qrTokens = new Map<string, { userId: number, expiresAt: Date }>();

// Generate a QR code token for a user
export async function generateQRToken(userId: number): Promise<string> {
  // Fetch the user to make sure they exist
  const user = await storage.getUser(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Generate a random token
  const token = crypto.randomBytes(16).toString('hex');
  
  // Set expiration to 5 minutes from now
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 5);
  
  // Store the token with user ID and expiration
  qrTokens.set(token, { userId, expiresAt });
  
  // Clean up expired tokens occasionally
  cleanupExpiredTokens();
  
  return token;
}

// Verify a QR code token and return the associated user ID
export function verifyQRToken(token: string): number | null {
  const tokenData = qrTokens.get(token);
  
  // Check if token exists and is not expired
  if (!tokenData || tokenData.expiresAt < new Date()) {
    // Delete expired token if it exists
    if (tokenData) {
      qrTokens.delete(token);
    }
    return null;
  }
  
  // Token is valid, return the user ID
  return tokenData.userId;
}

// Clean up expired tokens
function cleanupExpiredTokens(): void {
  const now = new Date();
  
  for (const [token, data] of qrTokens.entries()) {
    if (data.expiresAt < now) {
      qrTokens.delete(token);
    }
  }
}

// Function to check if student is eligible for an exam
export async function checkExamEligibility(studentId: number, examId: number): Promise<boolean> {
  try {
    return await storage.checkStudentEligibility(studentId, examId);
  } catch (error) {
    console.error('Error checking exam eligibility:', error);
    return false;
  }
}
