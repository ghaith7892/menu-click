/**
 * MenuClick Mobile — Design tokens synced from the web app's index.css.
 * Primary palette: vibrant violet/purple (#853CEC).
 * Matches the web app's brand identity exactly.
 */

const colors = {
  light: {
    // Legacy aliases
    text: '#1C1721',
    tint: '#853CEC',

    background: '#F9F8FE',
    foreground: '#1C1721',

    card: '#FFFFFF',
    cardForeground: '#1C1721',

    primary: '#853CEC',
    primaryForeground: '#FFFFFF',

    secondary: '#EEEAF7',
    secondaryForeground: '#2D2438',

    muted: '#F2F0F5',
    mutedForeground: '#786E87',

    accent: '#EEE9FA',
    accentForeground: '#5B1FCA',

    destructive: '#F04444',
    destructiveForeground: '#FFFFFF',

    border: '#DDD8E9',
    input: '#D8D3E6',
  },

  dark: {
    text: '#EEEBf5',
    tint: '#9A5EED',

    background: '#100D17',
    foreground: '#EEEBf5',

    card: '#1B1820',
    cardForeground: '#EEEBf5',

    primary: '#9A5EED',
    primaryForeground: '#FFFFFF',

    secondary: '#1E1A2A',
    secondaryForeground: '#E3E0EE',

    muted: '#1A1625',
    mutedForeground: '#887F9A',

    accent: '#241B3A',
    accentForeground: '#A87EED',

    destructive: '#C93333',
    destructiveForeground: '#FFFFFF',

    border: '#322B3B',
    input: '#2B2440',
  },

  // 0.75rem = 12px, matching --radius in web app
  radius: 12,
};

export default colors;
