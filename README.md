# Vertical Fragmentation System

A modern, interactive web application for visualizing and analyzing vertical fragmentation in distributed database design.

## Features
- **Editable Relation Information:**
  - Set relation name, attributes, and primary key.
- **Flexible Query Input:**
  - Add, edit, and remove queries with per-site access frequencies.
- **Matrix Calculations:**
  - Attribute Usage Matrix (queries × attributes)
  - Attribute Affinity Matrix (attribute × attribute)
  - Clustered Matrix (using BEA for optimal attribute order)
  - Vertical Fragments (using split quality maximization)
- **Modern UI:**
  - Clean, card-based layout
  - Responsive design for desktop and mobile
  - Clear, professional tables and forms
- **One-click Results:**
  - Click "View Result" to see all matrices and fragments
  - "Reset" to restore the default example

## Usage
1. **Open `index.html` in your browser.**
2. **Edit Relation Info:**
   - Change the relation name, attributes, or primary key as needed.
3. **Manage Queries:**
   - Add new queries or edit/remove existing ones.
   - Set the number of sites and access frequencies for each query.
4. **View Results:**
   - Click the **View Result** button to calculate and display all matrices and vertical fragments.
   - The system uses the Bond Energy Algorithm (BEA) for clustering and a split quality formula for optimal fragmentation.
5. **Reset:**
   - Click **Reset** to restore the default relation and queries.

## Customization
- **Thresholds and Fragmentation:**
  - The system uses a split quality maximization algorithm for vertical fragmentation. You can further customize the logic in `script.js` if needed.
- **Styling:**
  - All styles are in `styles.css`. You can adjust colors, spacing, or add dark mode as desired.

## Technology
- **HTML, CSS, JavaScript** (no frameworks required)
- No backend or server needed—runs entirely in your browser.

## Screenshots
![screenshot](screenshot.png)

## License
MIT License 