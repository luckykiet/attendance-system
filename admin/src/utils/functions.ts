export const capitalizeFirstLetterOfString = (str: string) => {
    if (!str || str.length === 0) return '';
    const firstLetter = str.charAt(0).toUpperCase();
    const restOfWord = str.slice(1);
    return firstLetter + restOfWord;
  };