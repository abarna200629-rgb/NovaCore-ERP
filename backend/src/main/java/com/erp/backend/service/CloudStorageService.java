package com.erp.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.file.Files;
import java.security.Key;

@Service
public class CloudStorageService {

    private static final String ALGORITHM = "AES";
    private static final byte[] KEY_BYTES = "NovaCoreCloudKey!".getBytes(); // Exactly 17 bytes? Wait!
    // "NovaCoreCloudKey!" is 17 bytes! "NovaCoreCloudKey" is 16 bytes!
    // Let's use exactly 16 bytes: "NovaCoreCloudKey" (16 characters = 16 bytes for AES-128)
    private static final String SECRET_KEY = "NovaCoreCloudKey";

    private final String storageDir = "cloud-storage";

    public CloudStorageService() {
        File dir = new File(storageDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }
    }

    public void uploadFile(Long id, MultipartFile file) throws Exception {
        byte[] fileBytes = file.getBytes();
        byte[] encryptedBytes = encrypt(fileBytes);

        File outputFile = new File(storageDir + File.separator + id + ".enc");
        try (FileOutputStream fos = new FileOutputStream(outputFile)) {
            fos.write(encryptedBytes);
        }
    }

    public byte[] downloadFile(Long id) throws Exception {
        File inputFile = new File(storageDir + File.separator + id + ".enc");
        if (!inputFile.exists()) {
            throw new RuntimeException("File not found in cloud storage.");
        }

        byte[] encryptedBytes = Files.readAllBytes(inputFile.toPath());
        return decrypt(encryptedBytes);
    }

    public long getStorageUsage() {
        File dir = new File(storageDir);
        long size = 0;
        File[] files = dir.listFiles();
        if (files != null) {
            for (File f : files) {
                if (f.isFile()) {
                    size += f.length();
                }
            }
        }
        return size;
    }

    private byte[] encrypt(byte[] data) throws Exception {
        Key key = new SecretKeySpec(SECRET_KEY.getBytes(), ALGORITHM);
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.ENCRYPT_MODE, key);
        return cipher.doFinal(data);
    }

    private byte[] decrypt(byte[] data) throws Exception {
        Key key = new SecretKeySpec(SECRET_KEY.getBytes(), ALGORITHM);
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.DECRYPT_MODE, key);
        return cipher.doFinal(data);
    }
}
