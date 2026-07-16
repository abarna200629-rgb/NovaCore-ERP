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

    @Value("${mail.from.name:NovaCore ERP}")
    private String mailFromName;

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
        String htmlContent = "<h2>Your OTP is: " + otp + "</h2><p>Valid for 10 minutes.</p>";
        sendEmailAsync(toEmail, "NovaCore ERP Login OTP", htmlContent);
    }

    // ALERT MAIL
    public void sendAlertMail(String toEmail, String subject, String text) {
        sendEmailAsync(toEmail, subject, text);
    }

    // ASYNC EMAIL HELPER
    private void sendEmailAsync(String toEmail, String subject, String content) {
        new Thread(() -> {
            System.out.println("=== EMAIL DISPATCH INITIATED ===");
            System.out.println("Mail Provider: " + mailProvider);
            System.out.println("Recipient: " + toEmail);
            System.out.println("================================");

            if ("BREVO".equalsIgnoreCase(mailProvider)) {
                try {
                    System.out.println("Attempting email dispatch via Brevo REST API...");
                    HttpClient client = HttpClient.newBuilder()
                            .connectTimeout(Duration.ofSeconds(5))
                            .build();

                    // Escape double quotes in content
                    String cleanContent = content.replace("\"", "\\\"");

                    String body = "{"
                            + "\"sender\":{"
                            + "\"name\":\"" + mailFromName + "\","
                            + "\"email\":\"" + mailFrom + "\""
                            + "},"
                            + "\"to\":["
                            + "{"
                            + "\"email\":\"" + toEmail + "\""
                            + "}"
                            + "],"
                            + "\"subject\":\"" + subject + "\","
                            + "\"htmlContent\":\"" + cleanContent + "\""
                            + "}";

                    HttpRequest request = HttpRequest.newBuilder()
                            .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                            .timeout(Duration.ofSeconds(10))
                            .header("api-key", brevoApiKey.trim())
                            .header("Content-Type", "application/json")
                            .POST(HttpRequest.BodyPublishers.ofString(body))
                            .build();

                    HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
                    
                    System.out.println("=== BREVO API RESPONSE ===");
                    System.out.println("Response Code: " + response.statusCode());
                    System.out.println("Response Body: " + response.body());

                    if (response.statusCode() == 201) {
                        System.out.println("Delivery Status: SUCCESS (Email accepted by Brevo)");
                    } else {
                        System.err.println("Delivery Status: FAILED (HTTP " + response.statusCode() + ")");
                    }
                    System.out.println("==========================");

                } catch (Exception e) {
                    System.err.println("Brevo API delivery encountered a critical exception. Stack Trace:");
                    e.printStackTrace();
                }
            } else if ("SMTP".equalsIgnoreCase(mailProvider)) {
                try {
                    System.out.println("Attempting email dispatch via SMTP...");
                    JavaMailSender mailSender = buildJavaMailSender();
                    SimpleMailMessage message = new SimpleMailMessage();
                    message.setFrom(mailFrom);
                    message.setTo(toEmail);
                    message.setSubject(subject);
                    // Standard SMTP text fallback
                    message.setText(content.replaceAll("<[^>]*>", "")); 
                    mailSender.send(message);
                    System.out.println("Delivery Status: SUCCESS (Email sent via SMTP to " + toEmail + ")");
                } catch (Exception e) {
                    System.err.println("SMTP Mail sending failed to: " + toEmail + ". Complete Error Stack Trace:");
                    e.printStackTrace();
                }
            } else {
                System.err.println("Unsupported mail provider specified: " + mailProvider);
            }
        }).start();
    }
}