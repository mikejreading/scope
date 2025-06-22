import * as React from "react"
import { cn } from "@/lib/utils"
import Image, { type ImageProps } from "next/image"

const Avatar = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & {
    src?: string
    alt?: string
  }
>(({ className, src, alt, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      {src ? (
        <Image 
          className="aspect-square h-full w-full object-cover" 
          src={src} 
          alt={alt || 'User avatar'} 
          aria-hidden={!alt}
          width={40}
          height={40}
        />
      ) : (
        <span 
          className="flex h-full w-full items-center justify-center rounded-full bg-muted"
          aria-hidden={!alt}
        >
          {alt?.[0]?.toUpperCase() || 'U'}
        </span>
      )}
    </span>
  )
})
Avatar.displayName = "Avatar"

interface AvatarImageProps extends Omit<ImageProps, 'src' | 'width' | 'height'> {
  src?: string | null
  width?: number
  height?: number
}

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, alt = '', src, width = 40, height = 40, ...props }, ref) => {
    // Only render the Image component if we have a valid src
    if (!src) {
      return null;
    }
    
    return (
      <Image
        ref={ref}
        className={cn("aspect-square h-full w-full object-cover", className)}
        alt={alt}
        aria-hidden={!alt}
        src={src}
        width={width}
        height={height}
        {...props}
      />
    );
  }
)
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }
