import { Tenant, User } from "@prisma/client";

export type TenantContext = {
  tenant: Tenant | null;
  user: User | null;
  isAuthenticated: boolean;
  isTenantAdmin: boolean;
  permissions: string[];
};

export const createTenantContext = (initialState: Partial<TenantContext> = {}): TenantContext => ({
  tenant: null,
  user: null,
  isAuthenticated: false,
  isTenantAdmin: false,
  permissions: [],
  ...initialState,
});

// This will be used in our React context
export const TenantContext = createContext<TenantContext>(createTenantContext());

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

interface TenantProviderProps {
  children: React.ReactNode;
  initialContext?: Partial<TenantContext>;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ 
  children, 
  initialContext = {} 
}) => {
  const [context, setContext] = useState<TenantContext>(createTenantContext(initialContext));

  const value = useMemo(() => ({
    ...context,
    setTenant: (tenant: Tenant | null) => 
      setContext(prev => ({ ...prev, tenant })),
    setUser: (user: User | null) => 
      setContext(prev => ({ ...prev, user, isAuthenticated: !!user })),
    setPermissions: (permissions: string[]) => 
      setContext(prev => ({ ...prev, permissions })),
    setIsTenantAdmin: (isTenantAdmin: boolean) => 
      setContext(prev => ({ ...prev, isTenantAdmin })),
  }), [context]);

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};
