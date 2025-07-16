import {
  InstagramLogoIcon,
  LinkedinLogoIcon,
  TwitterLogoIcon,
} from '@phosphor-icons/react'

import Card from '../Card/Index'

const Footer = () => {
  return (
    <Card className="bg-black/30 rounded-xl flex items-center justify-between p-4">
      <img
        src="https://framerusercontent.com/images/wBvSDht7DqRJpSfO2xTNgwgjvvo.png"
        srcSet="https://framerusercontent.com/images/wBvSDht7DqRJpSfO2xTNgwgjvvo.png?scale-down-to=512 512w,https://framerusercontent.com/images/wBvSDht7DqRJpSfO2xTNgwgjvvo.png?scale-down-to=1024 1024w,https://framerusercontent.com/images/wBvSDht7DqRJpSfO2xTNgwgjvvo.png 1528w"
        alt=""
        className="max-h-6"
      />
      <div className="flex items-center gap-4">
        <a
          href="/"
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <InstagramLogoIcon size={20} />
          <p>FPBlock</p>
        </a>
        <a
          href="/"
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <TwitterLogoIcon size={20} />
          <p>FPBlock</p>
        </a>
        <a
          href="/"
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <LinkedinLogoIcon size={20} />
          <p>FPBlock</p>
        </a>
      </div>
    </Card>
  )
}

export default Footer
