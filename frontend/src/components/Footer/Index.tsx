import { LinkedinLogoIcon, XLogoIcon } from '@phosphor-icons/react'

import Card from '../Card/Index'

const Footer = () => {
  return (
    <Card className="md:bg-gray-800/30 rounded-xl flex items-center justify-between p-4">
      <a
        href="https://www.fpblock.com/"
        target="_blank"
        rel="noopener"
        className="group"
      >
        <img
          src="https://framerusercontent.com/images/wBvSDht7DqRJpSfO2xTNgwgjvvo.png"
          srcSet="https://framerusercontent.com/images/wBvSDht7DqRJpSfO2xTNgwgjvvo.png?scale-down-to=512 512w,https://framerusercontent.com/images/wBvSDht7DqRJpSfO2xTNgwgjvvo.png?scale-down-to=1024 1024w,https://framerusercontent.com/images/wBvSDht7DqRJpSfO2xTNgwgjvvo.png 1528w"
          alt=""
          className="max-h-6 group-hover:opacity-80 transition-opacity"
        />
      </a>
      <div className="flex items-center gap-4">
        <a
          href="https://x.com/fpcomplete"
          target="_blank"
          className="flex items-center gap-2 text-white/70 hover:text-fpblock transition-colors"
          rel="noopener"
        >
          <XLogoIcon size={20} />
          <p>FPBlock</p>
        </a>
        <a
          href="https://www.linkedin.com/company/fpblock"
          target="_blank"
          className="flex items-center gap-2 text-white/70 hover:text-fpblock transition-colors"
          rel="noopener"
        >
          <LinkedinLogoIcon size={20} />
          <p>FPBlock</p>
        </a>
      </div>
    </Card>
  )
}

export default Footer
