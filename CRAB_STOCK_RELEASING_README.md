# Crab Stock Releasing Feature

## Overview
The Crab Stock Releasing feature allows quality control staff to officially release crab stock from the facility for either local sale or shipment to other countries.

## Features

### 1. Release Management
- **Local Sale**: Release stock for local market distribution
- **Shipments**: Release stock for international shipment with country specification
- **Box Tracking**: Visual indicators show which boxes have been released
- **Release History**: Track all released boxes in the dashboard

### 2. Certificate Generation
- **PNG Format**: Generate high-quality A4 portrait certificates
- **Professional Design**: Clean, branded certificate layout
- **Auto-download**: Certificates automatically download after generation
- **WhatsApp Sharing**: Direct sharing to WhatsApp with formatted message

### 3. Mobile Responsive
- **Touch-friendly**: Optimized for mobile devices
- **Responsive Grid**: Adapts to different screen sizes
- **Mobile-first**: Form layout optimized for small screens

## How to Use

### Step 1: Access the Feature
1. Navigate to the Quality Control Dashboard
2. Click the "Crab Stock Releasing" button in the Quick Actions section

### Step 2: Fill Release Form
1. **Date**: Select the release date (defaults to current date)
2. **Time**: Select the release time (defaults to current time)
3. **Box Number**: Enter the specific box number being released
4. **Destination Type**: Choose between "Local Sale" or "Shipments"
5. **Destination**: Enter the specific destination or country

### Step 3: Generate Certificate
1. Click "Release & Download Certificate"
2. PNG certificate automatically downloads
3. WhatsApp sharing opens automatically
4. Box is marked as released in the dashboard

### Step 4: Visual Tracking
- Released boxes show a blue send icon (📤)
- Release button appears when selecting filled boxes
- Stats card shows total released boxes count

## Technical Details

### Dependencies
- `html2canvas`: For PNG generation
- `react-hook-form`: For form management
- `zod`: For form validation

### File Structure
```
src/components/crab/
├── CrabStockReleasingDialog.tsx    # Main release dialog
└── ... (other crab components)

src/pages/dashboard/
└── QualityControlDashboard.tsx     # Updated dashboard with release feature
```

### Certificate Specifications
- **Format**: PNG
- **Size**: A4 Portrait (794x1123 pixels at 96 DPI)
- **Quality**: High resolution (2x scale)
- **Layout**: Professional certificate design with company branding

## Mobile Responsiveness

### Breakpoints
- **Mobile**: Single column layout, full-width dialog
- **Tablet**: Two-column form layout
- **Desktop**: Optimized spacing and layout

### Touch Optimization
- Large touch targets
- Swipe-friendly scrolling
- Optimized button sizes

## WhatsApp Integration

### Message Format
```
🦀 Crab Stock Release Certificate

📅 Date: [DATE]
⏰ Time: [TIME]
📦 Box Number: [BOX_NUMBER]
📍 Destination: [DESTINATION]
🚚 Type: [LOCAL_SALE/SHIPMENT]

✅ Stock has been released and is ready for [TYPE] to [DESTINATION]
```

### Direct Sharing
- Opens WhatsApp with pre-filled message
- Supports both mobile and desktop WhatsApp
- Automatic URL encoding for special characters

## Future Enhancements

### Planned Features
- **Batch Release**: Release multiple boxes at once
- **Release Templates**: Customizable certificate designs
- **Digital Signatures**: Add authorized personnel signatures
- **Export Options**: PDF, Excel, and other formats
- **Release Scheduling**: Plan releases in advance

### Integration Opportunities
- **Inventory Systems**: Sync with external inventory management
- **Shipping APIs**: Direct integration with shipping providers
- **Notification Systems**: Email/SMS notifications for releases
- **Analytics**: Release tracking and reporting

## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.
