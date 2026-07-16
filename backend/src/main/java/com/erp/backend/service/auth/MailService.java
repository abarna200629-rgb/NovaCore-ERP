package com.erp.backend.service.auth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class MailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.host:smtp.gmail.com}")
    private String mailHost;

    @Value("${spring.mail.port:587}")
    private String mailPort;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${mail.provider:SMTP}")
    private String mailProvider;

    @Value("${mail.api.key:}")
    private String mailApiKey;

    @Value("${mail.from:erpmanagement2028@gmail.com}")
    private String mailFrom;

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
            System.out.println("=== EMAIL CONFIGURATION ===");
            System.out.println("Mail Provider: " + mailProvider);
            System.out.println("SMTP Host: " + mailHost);
            System.out.println("SMTP Port: " + mailPort);
            System.out.println("SMTP Username: " + mailUsername);
            System.out.println("Sender Address (From): " + mailFrom);
            System.out.println("Recipient (To): " + toEmail);
            System.out.println("===========================");

            if ("SMTP".equalsIgnoreCase(mailProvider)) {
                try {
                    SimpleMailMessage message = new SimpleMailMessage();
                    message.setFrom(mailFrom);
                    message.setTo(toEmail);
                    message.setSubject(subject);
                    message.setText(text);
                    mailSender.send(message);
                    System.out.println("Email sent successfully via SMTP to: " + toEmail);
                } catch (Exception e) {
                    System.err.println("SMTP Mail sending failed to: " + toEmail + ". Complete Error Stack Trace:");
                    e.printStackTrace();
                }
            } else if ("RESEND".equalsIgnoreCase(mailProvider)) {
                try {
                    HttpClient client = HttpClient.newBuilder()
                            .connectTimeout(Duration.ofSeconds(5))
                            .build();
                    String body = "{"
                            + "\"from\":\"" + mailFrom + "\","
                            + "\"to\":\"" + toEmail + "\","
                            + "\"subject\":\"" + subject + "\","
                            + "\"html\":\"" + text.replace("\n", "<br>") + "\""
                            + "}";
                    HttpRequest request = HttpRequest.newBuilder()
                            .uri(URI.create("https://api.resend.com/emails"))
                            .timeout(Duration.ofSeconds(10))
                            .header("Authorization", "Bearer " + mailApiKey)
                            .header("Content-Type", "application/json")
                            .POST(HttpRequest.BodyPublishers.ofString(body))
                            .build();
                    HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
                    System.out.println("Resend API response status: " + response.statusCode() + ", body: " + response.body());
                } catch (Exception e) {
                    System.err.println("Resend API sending failed. Error: " + e.getMessage());
                    e.printStackTrace();
                }
            } else if ("BREVO".equalsIgnoreCase(mailProvider)) {
                try {
                    HttpClient client = HttpClient.newBuilder()
                            .connectTimeout(Duration.ofSeconds(5))
                            .build();
                    String body = "{"
                            + "\"sender\":{\"email\":\"" + mailFrom + "\"},"
                            + "\"to\":[{\"email\":\"" + toEmail + "\"}],"
                            + "\"subject\":\"" + subject + "\","
                            + "\"textContent\":\"" + text + "\""
                            + "}";
                    HttpRequest request = HttpRequest.newBuilder()
                            .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                            .timeout(Duration.ofSeconds(10))
                            .header("api-key", mailApiKey)
                            .header("Content-Type", "application/json")
                            .POST(HttpRequest.BodyPublishers.ofString(body))
                            .build();
                    HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
                    System.out.println("Brevo API response status: " + response.statusCode() + ", body: " + response.body());
                } catch (Exception e) {
                    System.err.println("Brevo API sending failed. Error: " + e.getMessage());
                    e.printStackTrace();
                }
            } else {
                System.err.println("Unsupported email provider: " + mailProvider);
            }
        }).start();
    }
}