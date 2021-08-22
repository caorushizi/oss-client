const useTheme = (): [string, string] => {
  const colors = [
    { top: "#8B5C68", bottomLeft: "#484B58", bottomRight: "#37394E" },
    { top: "#875D56", bottomLeft: "#484B58", bottomRight: "#3A3B4E" },
    { top: "#546F67", bottomLeft: "#484B58", bottomRight: "#333B4E" },
    { top: "#7D5A86", bottomLeft: "#484B58", bottomRight: "#39394E" },
    { top: "#80865A", bottomLeft: "#484B58", bottomRight: "#39394E" },
    { top: "#8B5C68", bottomLeft: "#484B58", bottomRight: "#39394E" },
  ];

  const theme = colors[Math.floor(Math.random() * colors.length)];

  const sideBgGradient = `linear(to-b, ${theme.top}, ${theme.bottomLeft})`;
  const mainBgGradient = `linear(to-b, ${theme.top}, ${theme.bottomRight})`;

  return [sideBgGradient, mainBgGradient];
};

export default useTheme;
