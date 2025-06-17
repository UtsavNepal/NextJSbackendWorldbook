-- CreateTable
CREATE TABLE "SignupOtp" (
    "email" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "birthday" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignupOtp_pkey" PRIMARY KEY ("email")
);
