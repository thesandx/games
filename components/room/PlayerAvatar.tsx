import { Avatar, type AvatarProps } from '@/components/ui/Avatar';
import { AVATAR_TONE } from '@/lib/players';
import type { AvatarColor } from '@/types/playroom';

export interface PlayerAvatarProps extends Omit<AvatarProps, 'name' | 'tone'> {
  player: { name: string; color: AvatarColor };
}

/**
 * A room player's face: drawn from their nickname, in the colour they chose.
 * The one place a stored `AvatarColor` turns into a design-language tone.
 */
export function PlayerAvatar({ player, ...rest }: PlayerAvatarProps) {
  return <Avatar name={player.name} tone={AVATAR_TONE[player.color]} {...rest} />;
}
