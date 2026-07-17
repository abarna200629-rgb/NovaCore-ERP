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

    @jakarta.annotation.PostConstruct
    public void initDiagnostics() {
        System.out.println("====================================================");
        System.out.println("NOVACORE ERP: MAIL SERVICE STARTUP DIAGNOSTICS");
        System.out.println("====================================================");
        System.out.println("System.getenv(\"BREVO_API_KEY\") = " + System.getenv("BREVO_API_KEY"));
        System.out.println("brevoApiKey = " + brevoApiKey);
        System.out.println("mailProvider = " + mailProvider);
        System.out.println("mailFrom = " + mailFrom);
        System.out.println("mailFromName = " + mailFromName);
        
        String activeApiKey = (brevoApiKey != null && !brevoApiKey.trim().isEmpty()) ? brevoApiKey : System.getenv("BREVO_API_KEY");
        if (activeApiKey == null || activeApiKey.trim().isEmpty()) {
            System.err.println("BREVO_API_KEY is not available in the local environment.");
        }
        
        if (mailFrom != null) {
            String lowerFrom = mailFrom.toLowerCase().trim();
            if (lowerFrom.endsWith("@gmail.com") || lowerFrom.endsWith("@yahoo.com") || lowerFrom.endsWith("@outlook.com") || lowerFrom.contains("@hotmail.com")) {
                System.err.println("WARNING: MAIL_FROM (" + mailFrom + ") uses a public email service. This will result in delivery failures (SPF/DMARC blocks) when sending through Brevo in production. A verified custom domain is highly recommended.");
                System.out.println("Mail Domain Configuration: Shared Brevo sender or unauthenticated public domain is being used.");
            } else {
                System.out.println("Mail Domain Configuration: Custom domain is configured (" + mailFrom.substring(mailFrom.indexOf("@") + 1) + ").");
            }
        }
        System.out.println("====================================================");
    }

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
        MailLogStore.log("OTP generated for recipient: " + toEmail + " is: " + otp);
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
            try {
                java.util.Map<String, String> env = System.getenv();
                java.util.List<String> keys = new java.util.ArrayList<>(env.keySet());
                java.util.Collections.sort(keys);
                MailLogStore.log("Available Env Keys: " + keys.toString());
            } catch (Exception e) {
                MailLogStore.logErr("Failed to read environment keys: " + e.getMessage());
            }

            String activeProvider = mailProvider;
            if (System.getenv("RENDER") != null || System.getenv("PORT") != null) {
                activeProvider = "BREVO";
            } else {
                if (System.getenv("MAIL_PROVIDER") != null && !System.getenv("MAIL_PROVIDER").trim().isEmpty()) {
                    activeProvider = System.getenv("MAIL_PROVIDER").trim();
                }
            }

            String activeApiKey = (brevoApiKey != null && !brevoApiKey.trim().isEmpty()) ? brevoApiKey : System.getenv("BREVO_API_KEY");
            if (activeApiKey != null) {
                activeApiKey = activeApiKey.trim();
            }

            MailLogStore.log("=== EMAIL DISPATCH INITIATED ===");
            MailLogStore.log("Active Mail Provider: " + activeProvider);
            MailLogStore.log("Recipient (To): " + toEmail);
            MailLogStore.log("Sender Address (From): " + mailFrom);
            MailLogStore.log("Sender Name: " + mailFromName);
            MailLogStore.log("Brevo API Key Exists: " + (activeApiKey != null && !activeApiKey.isEmpty()));
            if (activeApiKey != null && activeApiKey.length() > 6) {
                MailLogStore.log("Brevo API Key Prefix: " + activeApiKey.substring(0, 6) + "...");
            }
            MailLogStore.log("================================");

            if ("BREVO".equalsIgnoreCase(activeProvider)) {
                if (activeApiKey == null || activeApiKey.isEmpty()) {
                    MailLogStore.logErr("WARNING: BREVO configured as provider but BREVO_API_KEY is not set. Skipping transmission.");
                } else {
                    try {
                        MailLogStore.log("Attempting email dispatch via Brevo REST API...");
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

                        MailLogStore.log("Brevo API Payload Request: " + body);

                        HttpRequest request = HttpRequest.newBuilder()
                                .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                                .timeout(Duration.ofSeconds(10))
                                .header("api-key", activeApiKey)
                                .header("Content-Type", "application/json")
                                .POST(HttpRequest.BodyPublishers.ofString(body))
                                .build();

                        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
                        
                        MailLogStore.log("=== BREVO API RESPONSE ===");
                        MailLogStore.log("Response Code: " + response.statusCode());
                        MailLogStore.log("Response Body: " + response.body());

                        if (response.statusCode() == 201) {
                            MailLogStore.log("Delivery Status: SUCCESS (Email accepted by Brevo)");
                        } else {
                            MailLogStore.logErr("Delivery Status: FAILED (HTTP " + response.statusCode() + ")");
                        }
                        MailLogStore.log("==========================");

                    } catch (Exception e) {
                        MailLogStore.logErr("Brevo API delivery encountered a critical exception. Stack Trace:");
                        java.io.StringWriter sw = new java.io.StringWriter();
                        e.printStackTrace(new java.io.PrintWriter(sw));
                        MailLogStore.logErr(sw.toString());
                    }
                }
            } else if ("SMTP".equalsIgnoreCase(activeProvider)) {
                if (mailUsername == null || mailUsername.trim().isEmpty() || mailPassword == null || mailPassword.trim().isEmpty()) {
                    MailLogStore.logErr("WARNING: SMTP configured as provider but MAIL_USERNAME or MAIL_PASSWORD is not set. Skipping transmission.");
                } else {
                    try {
                        MailLogStore.log("Attempting email dispatch via SMTP...");
                        JavaMailSender mailSender = buildJavaMailSender();
                        SimpleMailMessage message = new SimpleMailMessage();
                        message.setFrom(mailFrom);
                        message.setTo(toEmail);
                        message.setSubject(subject);
                        message.setText(content.replaceAll("<[^>]*>", "")); 
                        mailSender.send(message);
                        MailLogStore.log("Delivery Status: SUCCESS (Email sent via SMTP to " + toEmail + ")");
                    } catch (Exception e) {
                        MailLogStore.logErr("SMTP Mail sending failed to: " + toEmail + ". Complete Error Stack Trace:");
                        java.io.StringWriter sw = new java.io.StringWriter();
                        e.printStackTrace(new java.io.PrintWriter(sw));
                        MailLogStore.logErr(sw.toString());
                    }
                }
            } else {
                MailLogStore.logErr("Unsupported mail provider specified: " + activeProvider);
            }
        }).start();
    }
}