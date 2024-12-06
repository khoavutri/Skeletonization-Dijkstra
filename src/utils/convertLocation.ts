export const convertLocation = (
  element: HTMLElement,
  clientX: number,
  clientY: number
) => {
  const rect = element.getBoundingClientRect();

  return { x: clientX - rect.left, y: clientY - rect.top };
};
