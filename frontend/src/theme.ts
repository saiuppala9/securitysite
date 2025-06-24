import { createTheme, MantineTheme } from '@mantine/core';

export const theme = createTheme({
  fontFamily: 'Inter, sans-serif',
  primaryColor: 'violet',
  colors: {
    violet: [
      '#f0ebff',
      '#dcd1f5',
      '#b1a2e8',
      '#8f76db',
      '#7048ce',
      '#5a28c2',
      '#4d1fb8',
      '#4018a0',
      '#36148b',
      '#2d1076',
    ],
    dark: [
      '#C1C2C5',
      '#A6A7AB',
      '#909296',
      '#5c5f66',
      '#373A40',
      '#2C2E33',
      '#25262b',
      '#1A1B1E',
      '#141517',
      '#101113',
    ],
  },

  components: {
    Button: {
      defaultProps: {
        radius: 'xl',
        variant: 'filled',
      },
      styles: (theme: MantineTheme) => ({
        root: {
          height: '48px',
          fontSize: '16px',
          fontWeight: 600,
          transition: 'transform 200ms ease, box-shadow 200ms ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows.lg,
          },
        },
      }),
    },
    TextInput: {
        defaultProps: {
            radius: 'md',
            size: 'md',
        },
        styles: (theme: MantineTheme) => ({
            input: {
                backgroundColor: theme.colors.dark[6],
                borderColor: theme.colors.dark[4],
                color: theme.white,
                '&:focus': {
                    borderColor: theme.colors.violet[6],
                },
            },
            label: {
                color: theme.colors.dark[2],
                fontWeight: 500,
            }
        })
    },
    PasswordInput: {
        defaultProps: {
            radius: 'md',
            size: 'md',
        },
        styles: (theme: MantineTheme) => ({
            input: {
                backgroundColor: theme.colors.dark[6],
                borderColor: theme.colors.dark[4],
                color: theme.white,
                '&:focus': {
                    borderColor: theme.colors.violet[6],
                },
            },
            label: {
                color: theme.colors.dark[2],
                fontWeight: 500,
            }
        })
    },
    Paper: {
      defaultProps: {
        p: 'xl',
        shadow: 'xl',
        radius: 'lg',
      },
      styles: (theme: MantineTheme) => ({
        root: {
            backgroundColor: theme.colors.dark[7],
        }
      })
    },
    Title: {
      styles: (theme: MantineTheme) => ({
        root: {
          fontWeight: 700,
          color: theme.white,
        },
      }),
    },
  },

  other: {
    gradient: 'linear-gradient(45deg, #5a28c2, #4018a0)',
  },
});
