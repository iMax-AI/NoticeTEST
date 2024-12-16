"use client";

import { useEffect, useState } from 'react';


import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { handleCredentialsSignIn, handelResendVerficationCode } from "@/app/actions/authActions";

import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";

import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";



const REGEXP_ONLY_DIGITS = /^\d+$/;


const OTPSchema = z.object({
    email: z.string().min(1, "Email is required.").email("Invalid email"),
    pin: z
      .string()
      .length(6, {
        message: "Your one-time password must be 6 characters.",
      })
      .regex(REGEXP_ONLY_DIGITS, "OTP must contain only digits"),
});

interface VerifyEmailProps {
    email: string;
    fullname: string;
    password: string;
}

import GlobalMessage from "@/components/GlobalMessage";

import emailjs from "emailjs-com";
// emailjs.init(process.env.NEXT_PUBLIC_EMAIL_JS_PUBLIC_KEY ?? "");

const sendVerificationMessage = async ({
  fullname,
  email,
  otp,
}: {
  fullname: string;
  email: string;
  otp: string;
}) => {
  try {
    const templateParams = {
      from_name: "Notice Reply",
      to_name: fullname,
      to_email: email,
      subject: "Email Verification Code",
      message: `Thank you for using Notice Reply. Please use the following verification code to complete your verification:

        Your OTP code is: ${otp}

        This code is valid for the next 15 minutes. If you didn't request this, please ignore this email.
      `,
    };

    const response = await emailjs.send(
      "service_gfpypir",
      "template_plvqxcg",
      templateParams,
      "TukdaH2sl4cOtqwja"
    );
    return response;

  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};


const VerifyEmail = ({ email, fullname, password }: VerifyEmailProps) => {
  const [countdown, setCountdown] = useState(30);
  const [isResendEnabled, setIsResendEnabled] = useState(false);
  
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyCodeExpiry, setVerifyCodeExpiry] = useState(
    new Date(Date.now() + 3600000)
  );

  const [globalMessage, setGlobalMessage] = useState("");
  const [globalSuccess, setGlobalSuccess] = useState("none");

  const form = useForm<z.infer<typeof OTPSchema>>({
    resolver: zodResolver(OTPSchema),
    defaultValues: {
      email: email,
      pin: "",
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsResendEnabled(true);
    }
  }, [countdown]);


  // Handle Resend Click
  const handleResendClick = async () => {
    setCountdown(30);
    setIsResendEnabled(false);
    setVerifyCode(Math.floor(100000 + Math.random() * 900000).toString());
    setVerifyCodeExpiry(new Date(Date.now() + 3600000));

    const result = await handelResendVerficationCode({
      email,
      verifyCode,
      verifyCodeExpiry,
    });

    if (result?.success) {
      setGlobalMessage(result.message);
      setGlobalSuccess("true");
      await sendVerificationMessage({
        fullname: fullname,
        email: email,
        otp: verifyCode,
      });
    } else {
      setGlobalMessage(result.message);
      setGlobalSuccess("false");
    }
  };


  const onSubmit = async (data: z.infer<typeof OTPSchema>) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();
      if (response.ok) {
        await handleCredentialsSignIn({ email, password });
        window.location.reload();
        window.location.href = "/";
      } else {
        setGlobalMessage(responseData.message);
        setGlobalSuccess("false");
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      setGlobalMessage("Something went wrong. Please try again.");
      setGlobalSuccess("false");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col justify-center font-inter">
      <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-24">
        <div className="flex justify-center">
          <div className="max-w-md mx-auto border-dotted border-4 border-black text-center px-4 sm:px-8 py-10 rounded-xl shadow">
          {globalMessage && (
            <GlobalMessage success={globalSuccess} message={globalMessage} onReset={() => setGlobalSuccess("none")} />
          )}
            <header className="mb-6">
              <h1 className="text-2xl text-black font-bold mb-1">Email Verification</h1>
              <p className="text-[15px] text-slate-700">
                Enter the 6-digit verification code sent to your Email.
              </p>
            </header>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
                <FormField
                  control={form.control}
                  name="pin"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <InputOTP
                          value={field.value}
                          onChange={(otp) => field.onChange(otp)}
                          maxLength={6}
                          pattern={REGEXP_ONLY_DIGITS.source}
                        >
                          <InputOTPGroup>
                            {[0, 1, 2, 3, 4, 5].map((index) => (
                              <InputOTPSlot
                                key={index}
                                index={index}
                                className={'text-black border-black text-center w-12 h-12 mx-1 rounded-lg border transition-all duration-200'}
                              />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <button
                  className="cursor-pointer px-4 py-2 mt-6 bg-[#222] relative group/btn w-full text-white rounded-md h-10 font-medium hover:bg-[#333] shadow-lg transition-all duration-[300ms]"
                  type="submit"
                >
                  {isSubmitting ? (
                    <>
                      <svg aria-hidden="true" role="status" className="inline w-4 h-4 me-3 text-gray-200 animate-spin dark:text-gray-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="#1C64F2"/>
                      </svg>
                      Loading...
                    </>
                  ) : (
                    <>
                      Verify Code & Sign In &rarr;
                    </>
                  )}
                </button>

                <div className="text-l text-slate-900 mt-4">
                  Did not receive code?{' '}
                  <button
                    onClick={handleResendClick}
                    disabled={!isResendEnabled}
                    className={`font-bold text-base bg-clip-text ${isResendEnabled ? 'bg-gradient-to-r from-blue-500 to-violet-500' : 'text-gray-400'}`}
                  >
                    Resend {countdown > 0 ? `in ${countdown}s` : ''}
                  </button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </main>
  );
};

export default VerifyEmail;