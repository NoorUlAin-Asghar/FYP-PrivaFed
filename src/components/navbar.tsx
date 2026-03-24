"use client"

import * as React from "react"
import Link from "next/link"
import { useState, useEffect } from "react"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, User } from "lucide-react"
import { usePathname, useRouter } from 'next/navigation'
import supabase from "@/lib/supabaseClient";

export function Navbar() {
  const pathname = usePathname()
  const hideNavbarOn = ['/sign-in']
  const minimalNavbar = hideNavbarOn.includes(pathname)
  const [userEmail, setUserEmail] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || "")
        setIsLoggedIn(true)
      }
    }

    getUser()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    localStorage.clear() // Clear localStorage
    router.push("/sign-in") // Redirect to sign-in
    setIsLoggedIn(false);
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-3 py-1 shadow-md bg-white">
      <div className="text-[#008080] max-w-7xl mx-auto grid grid-cols-2 items-center">
        {/* Left-side nav items */}
        <NavigationMenu>
          <NavigationMenuList className="flex space-x-2">
            <NavigationMenuItem>
              <NavigationMenuLink asChild className="text-3xl font-extrabold font-dancing">
                <Link href="/">PrivaFed</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Conditionally show right-side nav */}
        { !minimalNavbar && (
          <div className="flex justify-end">
            <NavigationMenu>
              <NavigationMenuList>
                {/* <NavigationMenuItem>
                  <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                    <Link href="/docs">Generate</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem> */}
                <NavigationMenuItem>
                  <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                    <Link href="/docs">Docs</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                {isLoggedIn?  /*if user is logged in - show dashboard*/
                <>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                    <Link href="/patientDashboard">Dashboard</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem> 
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1 px-3 py-2 font-medium rounded-md hover:bg-gray-100">
                    <User className="w-4 h-4" />
                    <span>{userEmail}</span>
                    <ChevronDown className="w-4 h-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                </>
                :
                <NavigationMenuItem>
                  <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                    <Link href="/sign-in">Sign In</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                } 
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        )}
      </div>
    </nav>
  )
}
