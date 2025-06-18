import { createTheme, MantineTheme, rgba } from '@mantine/core';

const theme = createTheme({
  fontFamily: 'Monaco, Courier, monospace',
  primaryColor: 'cyan',
  colors: {
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
    cyan: [
      '#E3FAFC',
      '#C5F6FA',
      '#99E9F2',
      '#66D9E8',
      '#3BC9DB',
      '#22B8CF',
      '#15AABF',
      '#1098AD',
      '#0C8599',
      '#097384',
    ],
  },
  components: {
    Button: {
      styles: (theme: MantineTheme) => ({
        root: {
          '&:hover': {
            backgroundColor: rgba(theme.colors.cyan[7], 0.9),
          },
        },
      }),
    },
  },
});

export default theme;
