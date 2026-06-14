import { definePreset } from '@primeuix/themes';
import Material from '@primeuix/themes/material';

// Indigo ramp anchored on #526ED3 at 500 (Material's default primary is emerald).
const indigo = {
    50: '#eef1fb',
    100: '#d4dcf5',
    200: '#b9c6ef',
    300: '#9fb0e9',
    400: '#849ae3',
    500: '#526ED3',
    600: '#4a63be',
    700: '#3e539e',
    800: '#31427e',
    900: '#25325f',
    950: '#19223f'
};

export const MaterialIndigoPreset = definePreset(Material, {
    semantic: {
        primary: indigo,
        colorScheme: {
            dark: {
                surface: {
                    0: '#ffffff',
                    50: '#f5f5f5',
                    100: '#e9e9e9',
                    200: '#c8c8c8',
                    300: '#a4a4a4',
                    400: '#818181',
                    500: '#666666',
                    600: '#515151',
                    700: '#3a3a3a',
                    800: '#262626',
                    900: '#1e1e1e',
                    950: '#121212'
                },
                formField: {
                    invalidBorderColor: '#F44435'
                }
            }
        }
    },
    components: {
        toggleswitch: {
            colorScheme: {
                dark: {
                    root: {
                        focusRing: {
                            color: '#A855F7'
                        }
                    }
                }
            }
        },
        button: {
            colorScheme: {
                dark: {
                    root: {
                        info: { background: '#9750DD', hoverBackground: '#8a45cf', activeBackground: '#7d3ac1', borderColor: '#9750DD', hoverBorderColor: '#8a45cf', activeBorderColor: '#7d3ac1' },
                        success: { background: '#268C40', hoverBackground: '#227d39', activeBackground: '#1e6e32', borderColor: '#268C40', hoverBorderColor: '#227d39', activeBorderColor: '#1e6e32' },
                        secondary: { background: '#575757', hoverBackground: '#4e4e4e', activeBackground: '#454545', borderColor: '#575757', hoverBorderColor: '#4e4e4e', activeBorderColor: '#454545' },
                        warn: { background: '#F57C00', hoverBackground: '#dd7000', activeBackground: '#c46300', borderColor: '#F57C00', hoverBorderColor: '#dd7000', activeBorderColor: '#c46300' },
                        danger: { background: '#EF4444', hoverBackground: '#dc2626', activeBackground: '#b91c1c', borderColor: '#EF4444', hoverBorderColor: '#dc2626', activeBorderColor: '#b91c1c' },
                        help: { background: '#9333EA', hoverBackground: '#7e22ce', activeBackground: '#6b21a8', borderColor: '#9333EA', hoverBorderColor: '#7e22ce', activeBorderColor: '#6b21a8' }
                    }
                }
            }
        }
    }
});
