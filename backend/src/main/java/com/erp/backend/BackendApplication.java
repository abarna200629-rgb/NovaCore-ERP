package com.erp.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        try {
            freePort(8080);
        } catch (Exception e) {
            System.err.println("Could not automatically free port 8080: " + e.getMessage());
        }
        SpringApplication.run(
                BackendApplication.class,
                args);
    }

    private static void freePort(int port) {
        String os = System.getProperty("os.name").toLowerCase();
        if (os.contains("win")) {
            try {
                System.out.println("Checking port " + port + " availability...");
                ProcessBuilder builder = new ProcessBuilder("cmd.exe", "/c", "netstat -ano");
                Process process = builder.start();
                java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(process.getInputStream()));
                String line;
                String targetPortStr = ":" + port;
                while ((line = reader.readLine()) != null) {
                    if (line.contains("LISTENING") && line.contains(targetPortStr)) {
                        String[] parts = line.trim().split("\\s+");
                        if (parts.length >= 5) {
                            String pid = parts[parts.length - 1];
                            long currentPid = ProcessHandle.current().pid();
                            if (!pid.equals(String.valueOf(currentPid))) {
                                System.out.println("Port " + port + " is in use by PID " + pid + ". Attempting to terminate...");
                                Process killProcess = Runtime.getRuntime().exec("taskkill /F /PID " + pid);
                                killProcess.waitFor();
                                System.out.println("Successfully terminated PID " + pid);
                                Thread.sleep(2000); // Give OS time to release the port socket
                            }
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("Failed to free port " + port + ": " + e.getMessage());
            }
        }
    }

    @Bean
    public CommandLineRunner cleanDatabase(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                System.out.println("Cleaning attendance check-in/out times...");
                jdbcTemplate.execute("UPDATE attendance SET check_in_time = NULL WHERE check_in_time LIKE '%pm%' OR check_in_time LIKE '%am%'");
                jdbcTemplate.execute("UPDATE attendance SET check_out_time = NULL WHERE check_out_time LIKE '%pm%' OR check_out_time LIKE '%am%'");
                System.out.println("Attendance cleanup completed successfully.");
            } catch (Exception e) {
                System.out.println("Error cleaning database: " + e.getMessage());
            }
        };
    }
}
