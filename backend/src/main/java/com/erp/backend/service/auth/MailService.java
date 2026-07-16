package com.erp.backend.service.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Properties;

@Service
public class MailService {

    @Value("${spring.mail.host:smtp.gmail.com}")
    private String mailHost;

    @Value("${spring.mail.port:587}")
    private String mailPort;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${spring.mail.properties.mail.smtp.starttls.enable:true}")
    private String mailStartTls;

    @Value("${spring.mail.properties.mail.smtp.ssl.enable:false}")
    private String mailSsl;

    @Value("${spring.mail.properties.mail.smtp.connectiontimeout:5000}")
    private String mailConnectionTimeout;

    @Value("${mail.provider:BREVO}")
    private String mailProvider;

    @Value("${brevo.api.key:}")
    private String brevoApiKey;

    @Value("${mail.from:erpmanagement2028@gmail.com}")
    private String mailFrom;

    // Build mail sender programmatically to ensure properties are loaded
    private JavaMailSender buildJavaMailSender() {
        JavaMailSenderImpl mailSenderImpl = new JavaMailSenderImpl();
        mailSenderImpl.setHost(mailHost.trim());
        try {
            mailSenderImpl.setPort(Integer.parseInt(mailPort.trim()));
        } catch (Exception e) {
            mailSenderImpl.setPort(587);
        }
        mailSenderImpl.setUsername(mailUsername.trim());
        mailSenderImpl.setPassword(mailPassword);

        Properties props = mailSenderImpl.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", Boolean.valueOf(mailStartTls.trim()));
        props.put("mail.smtp.ssl.enable", Boolean.valueOf(mailSsl.trim()));
        
        try {
            int timeoutMs = Integer.parseInt(mailConnectionTimeout.trim());
            props.put("mail.smtp.connectiontimeout", timeoutMs);
            props.put("mail.smtp.timeout", timeoutMs);
            props.put("mail.smtp.writetimeout", timeoutMs);
        } catch (Exception e) {
            props.put("mail.smtp.connectiontimeout", 5000);
            props.put("mail.smtp.timeout", 5000);
            props.put("mail.smtp.writetimeout", 5000);
        }

        if ("true".equalsIgnoreCase(mailSsl.trim())) {
            props.put("mail.smtp.socketFactory.port", mailPort.trim());
            props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
            props.put("mail.smtp.socketFactory.fallback", "false");
        }

        return mailSenderImpl;
    }

    // OTP MAIL
    public void sendOtpMail(String toEmail, String otp) {
        System.out.println("OTP generated for recipient: " + toEmail + " is: " + otp);
        sendEmailAsync(toEmail, "ERP Login OTP", "Your ERP Login OTP is: " + otp + "\n\nValid for 10 minutes.");
    }

    // ALERT MAIL
    public void sendAlertMail(String toEmail, String subject, String text) {
        sendEmailAsync(toEmail, subject, text);
    }

    // ASYNC EMAIL HELPER WITH DETAILED LOGGING AND FALLBACK
    private void sendEmailAsync(String toEmail, String subject, String text) {
        new Thread(() -> {
            System.out.println("=== EMAIL TRANSMISSION INITIATED ===");
            System.out.println("Recipient (To): " + toEmail);
            System.out.println("Subject: " + subject);
            System.out.println("Active Mail Provider: " + mailProvider);
            System.out.println("SMTP Configuration Host: " + mailHost);
            System.out.println("SMTP Configuration Port: " + mailPort);
            System.out.println("SMTP Configuration Username: " + mailUsername);
            System.out.println("SMTP StartTLS Enabled: " + mailStartTls);
            System.out.println("SMTP SSL Enabled: " + mailSsl);
            System.out.println("SMTP Connection Timeout: " + mailConnectionTimeout + "ms");
            System.out.println("Sender Address (From): " + mailFrom);
            System.out.println("====================================");

            boolean sent = false;

            // 1. Attempt SMTP if configured and selected
            if ("SMTP".equalsIgnoreCase(mailProvider)) {
                try {
                    System.out.println("Attempting email dispatch via SMTP...");
                    JavaMailSender mailSender = buildJavaMailSender();
                    SimpleMailMessage message = new SimpleMailMessage();
                    message.setFrom(mailFrom);
                    message.setTo(toEmail);
                    message.setSubject(subject);
                    message.setText(text);
                    mailSender.send(message);
                    System.out.println("Email sent successfully via SMTP to: " + toEmail);
                    sent = true;
                } catch (Exception e) {
                    System.err.println("SMTP Mail sending failed to: " + toEmail + ". Complete Error Stack Trace:");
                    e.printStackTrace();
                    if (brevoApiKey != null && !brevoApiKey.trim().isEmpty()) {
                        System.out.println("SMTP failed. Initiating automatic fallback to Brevo API...");
                    } else {
                        System.err.println("SMTP failed and no fallback BREVO API Key is configured.");
                    }
                }
            }

            // 2. Attempt Brevo if selected OR as automatic fallback
            if (!sent && ("BREVO".equalsIgnoreCase(mailProvider) || (brevoApiKey != null && !brevoApiKey.trim().isEmpty()))) {
                try {
                    System.out.println("Attempting email dispatch via Brevo API...");
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
                            .header("api-key", brevoApiKey)
                            .header("Content-Type", "application/json")
                            .POST(HttpRequest.BodyPublishers.ofString(body))
                            .build();
                    HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
                    if (response.statusCode() >= 200 && response.statusCode() < 300) {
                        System.out.println("Email sent successfully via Brevo API to: " + toEmail);
                        sent = true;
                    } else {
                        System.err.println("Brevo API responded with error code: " + response.statusCode() + ", body: " + response.body());
                    }
                } catch (Exception ex) {
                    System.err.println("Brevo API sending failed. Error: " + ex.getMessage());
                    ex.printStackTrace();
                }
            }

            if (!sent) {
                System.err.println("All configured email dispatch channels failed to send message to: " + toEmail);
            }
        }).start();
    }
}