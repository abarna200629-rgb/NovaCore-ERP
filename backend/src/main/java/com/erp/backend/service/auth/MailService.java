package com.erp.backend.service.auth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class MailService {

    @Autowired
    private JavaMailSender mailSender;

    // OTP MAIL
    public void sendOtpMail(String toEmail, String otp) {
        sendEmailAsync(toEmail, "ERP Login OTP", "Your ERP Login OTP is: " + otp + "\n\nValid for 10 minutes.");
    }

    // ALERT MAIL
    public void sendAlertMail(String toEmail, String subject, String text) {
        sendEmailAsync(toEmail, subject, text);
    }

    // ASYNC EMAIL HELPER
    private void sendEmailAsync(String toEmail, String subject, String text) {
        new Thread(() -> {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(toEmail);
                message.setSubject(subject);
                message.setText(text);
                mailSender.send(message);
                System.out.println("Email sent successfully to: " + toEmail + " with subject: " + subject);
            } catch (Exception e) {
                System.err.println("SMTP Mail sending failed to: " + toEmail + ". Complete Error Stack Trace:");
                e.printStackTrace();
                System.out.println("[CONSOLE MAIL FALLBACK]");
                System.out.println("To: " + toEmail);
                System.out.println("Subject: " + subject);
                System.out.println("Body:\n" + text);
                System.out.println("==========================================");
            }
        }).start();
    }
}