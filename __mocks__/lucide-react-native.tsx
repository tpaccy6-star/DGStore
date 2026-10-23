import React from 'react';
import { View } from 'react-native';

type IconProps = Record<string, unknown>;

function Icon(props: IconProps): React.JSX.Element {
  return <View {...props} />;
}

export const ArrowRight = Icon;
export const Check = Icon;
export const ChevronDown = Icon;
export const ChevronLeft = Icon;
export const ChevronRight = Icon;
export const Heart = Icon;
export const Home = Icon;
export const Package = Icon;
export const Search = Icon;
export const ShoppingBag = Icon;
export const Star = Icon;
export const UserRound = Icon;
