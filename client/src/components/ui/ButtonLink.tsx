import { Link, type LinkProps } from 'react-router-dom';
import { buttonClasses, type Size, type Variant } from './Button';

export function ButtonLink({ variant = 'primary', size = 'md', className, ...rest }: LinkProps & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClasses(variant, size, className)} {...rest} />;
}
