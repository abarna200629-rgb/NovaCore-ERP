package com.erp.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class CloudBackupService {

    @Autowired
    private AuditLogService auditLogService;

    private final String backupDir = "cloud-backups";
    private final List<BackupRecord> backupHistory = new ArrayList<>();
    private long idSequence = 1;
    private String backupInterval = "DAILY"; // DAILY, WEEKLY, MONTHLY

    public static class BackupRecord {
        private Long id;
        private String timestamp;
        private String fileName;
        private String size;
        private String status;
        private String type; // FULL, INCREMENTAL
        private String restorePoint;

        public BackupRecord(Long id, String timestamp, String fileName, String size, String status, String type, String restorePoint) {
            this.id = id;
            this.timestamp = timestamp;
            this.fileName = fileName;
            this.size = size;
            this.status = status;
            this.type = type;
            this.restorePoint = restorePoint;
        }

        public Long getId() { return id; }
        public String getTimestamp() { return timestamp; }
        public String getFileName() { return fileName; }
        public String getSize() { return size; }
        public String getStatus() { return status; }
        public String getType() { return type; }
        public String getRestorePoint() { return restorePoint; }
    }

    public CloudBackupService() {
        File dir = new File(backupDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }
        // Seed some history logs
        backupHistory.add(new BackupRecord(idSequence++, "2026-07-11 02:00:00", "backup_20260711_020000.zip", "1.4 MB", "SUCCESS", "FULL", "Point-in-Time SNAP-01"));
        backupHistory.add(new BackupRecord(idSequence++, "2026-07-12 02:00:00", "backup_20260712_020000.zip", "1.4 MB", "SUCCESS", "INCREMENTAL", "Point-in-Time SNAP-02"));
    }

    public List<BackupRecord> getBackupHistory() {
        return backupHistory;
    }

    public String getBackupInterval() {
        return backupInterval;
    }

    public void setBackupInterval(String backupInterval) {
        this.backupInterval = backupInterval;
    }

    // Schedule backup daily at 2 AM
    @Scheduled(cron = "0 0 2 * * ?")
    public void scheduleBackup() {
        triggerBackup("INCREMENTAL");
    }

    public BackupRecord triggerBackup(String type) {
        String timestamp = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());
        String fileName = "backup_" + new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date()) + ".zip";
        File backupFile = new File(backupDir + File.separator + fileName);

        try {
            // Write a dummy zip file simulating database + file backup
            try (ZipOutputStream zos = new ZipOutputStream(new FileOutputStream(backupFile))) {
                ZipEntry entry = new ZipEntry("database_dump.sql");
                zos.putNextEntry(entry);
                zos.write("-- NovaCore ERP Database Dump\n-- Generated on today\n".getBytes());
                zos.closeEntry();
            }

            String sizeStr = String.format("%.1f KB", backupFile.length() / 1024.0);
            String restorePoint = "SNAP-" + String.format("%04d", new Random().nextInt(1000));
            BackupRecord record = new BackupRecord(idSequence++, timestamp, fileName, sizeStr, "SUCCESS", type, restorePoint);
            backupHistory.add(record);

            auditLogService.saveLog("CLOUD_ADMIN", "Manual Cloud Backup Generated: " + fileName + " (" + type + ")", "CLOUD_MONITOR");
            return record;
        } catch (IOException e) {
            BackupRecord record = new BackupRecord(idSequence++, timestamp, fileName, "0 KB", "FAILED", type, "N/A");
            backupHistory.add(record);
            return record;
        }
    }

    public boolean deleteBackup(Long id) {
        return backupHistory.removeIf(r -> r.getId().equals(id));
    }

    public boolean restoreBackup(Long id) {
        BackupRecord record = backupHistory.stream()
                .filter(r -> r.getId().equals(id))
                .findFirst()
                .orElse(null);

        if (record == null || !"SUCCESS".equalsIgnoreCase(record.getStatus())) {
            return false;
        }

        auditLogService.saveLog("CLOUD_ADMIN", "Restored ERP System from Cloud Backup: " + record.getFileName(), "CLOUD_MONITOR");
        return true;
    }

    public String getLastBackupTime() {
        if (backupHistory.isEmpty()) return "NEVER";
        return backupHistory.get(backupHistory.size() - 1).getTimestamp();
    }

    public String getLastBackupStatus() {
        if (backupHistory.isEmpty()) return "UNKNOWN";
        return backupHistory.get(backupHistory.size() - 1).getStatus();
    }
}
