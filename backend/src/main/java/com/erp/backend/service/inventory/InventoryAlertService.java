package com.erp.backend.service.inventory;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.erp.backend.entity.auth.User;
import com.erp.backend.repository.auth.UserRepository;
import com.erp.backend.service.auth.MailService;

@Service
public class InventoryAlertService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MailService mailService;

    public void sendLowStockAlert(
            String productName,
            Integer quantity) {

        User admin =
                userRepository
                        .findByUsername("admin")
                        .orElse(null);

        User inventoryUser =
                userRepository
                        .findByUsername("inventory_user")
                        .orElse(null);

        String subject =
                "LOW STOCK ALERT";

        String message =
                "ERP Inventory Alert\n\n"
                + "Product : "
                + productName
                + "\nCurrent Stock : "
                + quantity
                + "\n\nPlease Restock Immediately.";

        if (admin != null &&
                admin.getEmail() != null) {

            mailService.sendAlertMail(
                    admin.getEmail(),
                    subject,
                    message);
        }

        if (inventoryUser != null &&
                inventoryUser.getEmail() != null) {

            mailService.sendAlertMail(
                    inventoryUser.getEmail(),
                    subject,
                    message);
        }
    }
}