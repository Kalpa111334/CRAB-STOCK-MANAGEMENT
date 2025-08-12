-- =====================================================
-- CRAB STOCK RELEASING DATABASE SCHEMA
-- =====================================================
-- This SQL file contains the database structure for the
-- Crab Stock Releasing feature in the Quality Control Dashboard
-- =====================================================

-- Enable UUID extension for PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CRAB RELEASES TABLE
-- =====================================================
-- Main table to track all crab stock releases
CREATE TABLE IF NOT EXISTS crab_releases (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    release_number VARCHAR(50) UNIQUE NOT NULL,
    box_number VARCHAR(20) NOT NULL,
    release_date DATE NOT NULL,
    release_time TIME NOT NULL,
    destination_type VARCHAR(20) CHECK (destination_type IN ('local_sale', 'shipments')) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    certificate_path VARCHAR(500),
    whatsapp_shared BOOLEAN DEFAULT FALSE,
    shared_at TIMESTAMP NULL,
    notes TEXT,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes after table creation for PostgreSQL compatibility
CREATE INDEX idx_crab_box_number ON crab_releases(box_number);
CREATE INDEX idx_crab_release_date ON crab_releases(release_date);
CREATE INDEX idx_crab_destination_type ON crab_releases(destination_type);image.png
CREATE INDEX idx_crab_created_by ON crab_releases(created_by);
CREATE INDEX idx_crab_release_number ON crab_releases(release_number);

-- =====================================================
-- 2. RELEASE CERTIFICATES TABLE
-- =====================================================
-- Store certificate metadata and file information
CREATE TABLE IF NOT EXISTS release_certificates (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    release_id VARCHAR(36) NOT NULL,
    certificate_type VARCHAR(10) CHECK (certificate_type IN ('png', 'pdf')) DEFAULT 'png',
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100) DEFAULT 'image/png',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (release_id) REFERENCES crab_releases(id) ON DELETE CASCADE
);

-- Add indexes after table creation
CREATE INDEX idx_cert_release_id ON release_certificates(release_id);
CREATE INDEX idx_cert_generated_at ON release_certificates(generated_at);

-- =====================================================
-- 3. RELEASE DESTINATIONS TABLE
-- =====================================================
-- Predefined destinations for quick selection
CREATE TABLE IF NOT EXISTS release_destinations (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('local_sale', 'shipments')) NOT NULL,
    country_code VARCHAR(3),
    country_name VARCHAR(100),
    city VARCHAR(100),
    address TEXT,
    contact_person VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes after table creation
CREATE INDEX idx_dest_type ON release_destinations(type);
CREATE INDEX idx_dest_country_code ON release_destinations(country_code);
CREATE INDEX idx_dest_is_active ON release_destinations(is_active);

-- =====================================================
-- 4. RELEASE STATUS TRACKING TABLE
-- =====================================================
-- Track the status of each release through its lifecycle
CREATE TABLE IF NOT EXISTS release_status_history (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    release_id VARCHAR(36) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'released', 'shipped', 'delivered', 'cancelled')) NOT NULL,
    status_notes TEXT,
    changed_by VARCHAR(36) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (release_id) REFERENCES crab_releases(id) ON DELETE CASCADE
);

-- Add indexes after table creation
CREATE INDEX idx_status_release_id ON release_status_history(release_id);
CREATE INDEX idx_status_status ON release_status_history(status);
CREATE INDEX idx_status_changed_at ON release_status_history(changed_at);

-- =====================================================
-- 5. RELEASE APPROVALS TABLE
-- =====================================================
-- Track approval workflow for releases
CREATE TABLE IF NOT EXISTS release_approvals (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    release_id VARCHAR(36) NOT NULL,
    approver_id VARCHAR(36) NOT NULL,
    approval_status VARCHAR(20) CHECK (approval_status IN ('pending', 'approved', 'rejected')) NOT NULL,
    approval_notes TEXT,
    approved_at TIMESTAMP NULL,
    
    -- Foreign key constraint
    FOREIGN KEY (release_id) REFERENCES crab_releases(id) ON DELETE CASCADE
);

-- Add indexes after table creation
CREATE INDEX idx_approval_release_id ON release_approvals(release_id);
CREATE INDEX idx_approval_approver_id ON release_approvals(approver_id);
CREATE INDEX idx_approval_status ON release_approvals(approval_status);

-- =====================================================
-- 6. RELEASE NOTIFICATIONS TABLE
-- =====================================================
-- Track notification history for releases
CREATE TABLE IF NOT EXISTS release_notifications (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    release_id VARCHAR(36) NOT NULL,
    notification_type VARCHAR(20) CHECK (notification_type IN ('whatsapp', 'email', 'sms', 'system')) NOT NULL,
    recipient VARCHAR(255),
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivery_status VARCHAR(20) CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed')) DEFAULT 'pending',
    error_message TEXT,
    
    -- Foreign key constraint
    FOREIGN KEY (release_id) REFERENCES crab_releases(id) ON DELETE CASCADE
);

-- Add indexes after table creation
CREATE INDEX idx_notif_release_id ON release_notifications(release_id);
CREATE INDEX idx_notif_type ON release_notifications(notification_type);
CREATE INDEX idx_notif_sent_at ON release_notifications(sent_at);
CREATE INDEX idx_notif_delivery_status ON release_notifications(delivery_status);

-- =====================================================
-- 7. RELEASE TEMPLATES TABLE
-- =====================================================
-- Store customizable certificate templates
CREATE TABLE IF NOT EXISTS release_templates (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(10) CHECK (template_type IN ('png', 'pdf')) DEFAULT 'png',
    template_data JSONB NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes after table creation
CREATE INDEX idx_template_type ON release_templates(template_type);
CREATE INDEX idx_is_default ON release_templates(is_default);
CREATE INDEX idx_is_active ON release_templates(is_active);

-- =====================================================
-- 8. RELEASE STATISTICS VIEW
-- =====================================================
-- View for quick access to release statistics
CREATE OR REPLACE VIEW release_statistics AS
SELECT 
    COUNT(*) as total_releases,
    COUNT(CASE WHEN destination_type = 'local_sale' THEN 1 END) as local_sales,
    COUNT(CASE WHEN destination_type = 'shipments' THEN 1 END) as shipments,
    COUNT(CASE WHEN release_date = CURRENT_DATE THEN 1 END) as releases_today,
    COUNT(CASE WHEN release_date >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as releases_this_week,
    COUNT(CASE WHEN release_date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as releases_this_month,
    COUNT(CASE WHEN whatsapp_shared = TRUE THEN 1 END) as whatsapp_shared_count
FROM crab_releases;

-- =====================================================
-- 9. SAMPLE DATA INSERTION
-- =====================================================
-- Sample data has been removed to keep the schema clean
-- You can add your own sample data as needed after creating the tables

-- =====================================================
-- 10. FUNCTIONS FOR POSTGRESQL
-- =====================================================

-- Function to generate release number
CREATE OR REPLACE FUNCTION generate_release_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    current_date_str VARCHAR(8);
    sequence_number INTEGER;
    release_number VARCHAR(50);
BEGIN
    current_date_str := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(release_number FROM 10) AS INTEGER)), 0) + 1
    INTO sequence_number
    FROM crab_releases 
    WHERE release_number LIKE 'REL-' || current_date_str || '-%';
    
    release_number := 'REL-' || current_date_str || '-' || LPAD(sequence_number::TEXT, 4, '0');
    RETURN release_number;
END;
$$ LANGUAGE plpgsql;

-- Function to create a new release
CREATE OR REPLACE FUNCTION create_crab_release(
    p_box_number VARCHAR(20),
    p_release_date DATE,
    p_release_time TIME,
    p_destination_type VARCHAR(20),
    p_destination VARCHAR(255),
    p_notes TEXT,
    p_created_by VARCHAR(36)
)
RETURNS VARCHAR(36) AS $$
DECLARE
    v_release_number VARCHAR(50);
    v_release_id VARCHAR(36);
BEGIN
    -- Generate release number
    v_release_number := generate_release_number();
    
    -- Create release record
    INSERT INTO crab_releases (
        release_number, box_number, release_date, release_time,
        destination_type, destination, notes, created_by
    ) VALUES (
        v_release_number, p_box_number, p_release_date, p_release_time,
        p_destination_type, p_destination, p_notes, p_created_by
    )
    RETURNING id INTO v_release_id;
    
    -- Create initial status record
    INSERT INTO release_status_history (release_id, status, changed_by)
    VALUES (v_release_id, 'pending', p_created_by);
    
    RETURN v_release_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 11. TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp for crab_releases
CREATE TRIGGER update_crab_releases_timestamp
    BEFORE UPDATE ON crab_releases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at timestamp for release_destinations
CREATE TRIGGER update_release_destinations_timestamp
    BEFORE UPDATE ON release_destinations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at timestamp for release_templates
CREATE TRIGGER update_release_templates_timestamp
    BEFORE UPDATE ON release_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 12. ADDITIONAL INDEXES FOR PERFORMANCE
-- =====================================================

-- Composite indexes for common query patterns
CREATE INDEX idx_crab_release_date_type ON crab_releases(release_date, destination_type);
CREATE INDEX idx_crab_box_date ON crab_releases(box_number, release_date);
CREATE INDEX idx_crab_created_date ON crab_releases(created_by, created_at);

-- =====================================================
-- 13. CONSTRAINTS AND VALIDATIONS
-- =====================================================

-- Add check constraints for data validation
ALTER TABLE crab_releases 
ADD CONSTRAINT chk_release_date_future 
CHECK (release_date <= CURRENT_DATE);

ALTER TABLE crab_releases 
ADD CONSTRAINT chk_box_number_format 
CHECK (box_number ~ '^[0-9]+$');

-- =====================================================
-- 14. CLEANUP AND MAINTENANCE
-- =====================================================

-- Function to cleanup old releases (optional)
CREATE OR REPLACE FUNCTION cleanup_old_releases(days_to_keep INTEGER)
RETURNS VOID AS $$
DECLARE
    cutoff_date DATE;
BEGIN
    cutoff_date := CURRENT_DATE - INTERVAL '1 day' * days_to_keep;
    
    -- Log cleanup operation
    INSERT INTO release_notifications (release_id, notification_type, message, delivery_status)
    VALUES ('system', 'system', 'Cleanup completed for records older than ' || days_to_keep || ' days', 'delivered');
    
    -- Note: Uncomment the following line if you want to automatically delete old records
    -- DELETE FROM crab_releases WHERE release_date < cutoff_date;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 15. BACKUP AND RESTORE FUNCTIONS
-- =====================================================

-- Function to backup release data
CREATE OR REPLACE FUNCTION backup_release_data(backup_date DATE)
RETURNS VOID AS $$
DECLARE
    backup_table_name VARCHAR(100);
BEGIN
    -- Create backup table with date suffix
    backup_table_name := 'crab_releases_backup_' || TO_CHAR(backup_date, 'YYYYMMDD');
    
    EXECUTE 'CREATE TABLE ' || backup_table_name || ' AS SELECT * FROM crab_releases';
    
    -- Log backup operation
    INSERT INTO release_notifications (release_id, notification_type, message, delivery_status)
    VALUES ('system', 'system', 'Backup completed for ' || backup_table_name, 'delivered');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- END OF SQL FILE
-- =====================================================
-- 
-- To execute this file:
-- 1. PostgreSQL: psql -U username -d database_name -f crab_stock_releasing.sql
-- 
-- Note: This file is now optimized for PostgreSQL
-- =====================================================
