const fs = require('fs');

let code = fs.readFileSync('src/components/admin/UsersTab.tsx', 'utf8');

// 1. Add imports
code = code.replace(/import { Trash2, Search, Loader2, /g, 'import { Trash2, Search, Loader2, Filter, ');
code = code.replace('import { Separator } from "@/components/ui/separator";', 'import { Separator } from "@/components/ui/separator";\nimport { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";');

// 2. Add state
const stateToInject = `  const [filterTitle, setFilterTitle] = useState("");
  const [filterContact, setFilterContact] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterVisa, setFilterVisa] = useState("");
`;
code = code.replace('  const [roleFilter, setRoleFilter] = useState("all");\n', '  const [roleFilter, setRoleFilter] = useState("all");\n' + stateToInject);

// 3. Update filter logic
const oldFilterLogic = /  const filteredUsers = users\.filter\(\(user\) => \{([\s\S]*?)  \}\);/;
const newFilterLogic = `  const filteredUsers = users.filter((user) => {
    const matchesName = (user.full_name?.toLowerCase().includes(nameFilter.toLowerCase()) || 
                        user.email?.toLowerCase().includes(nameFilter.toLowerCase()));
    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    const { city, state } = splitLocation(user.details?.location);
    const userTitle = (user.role === 'candidate' ? user.details?.desired_job_title : user.details?.job_title || user.details?.recruiter_job_title || '') || '';
    const userLocation = \`\${city}, \${state}\`;
    const userVisa = user.details?.work_authorization || user.details?.visa_type || '';
    const userContact = user.details?.phone || user.phone || '';

    const matchesTitle = userTitle.toLowerCase().includes(filterTitle.toLowerCase());
    const matchesContact = userContact.toLowerCase().includes(filterContact.toLowerCase());
    const matchesLoc = userLocation.toLowerCase().includes(filterLocation.toLowerCase());
    const matchesVisa = userVisa.toLowerCase().includes(filterVisa.toLowerCase());

    return matchesName && matchesRole && matchesTitle && matchesContact && matchesLoc && matchesVisa;
  });`;
code = code.replace(oldFilterLogic, newFilterLogic);

// 4. Create Header Component
const headerComponent = `
const FilterHeader = ({ label, filterValue, setFilterValue }: { label: string, filterValue: string, setFilterValue: (val: string) => void }) => (
  <div className="flex items-center justify-between w-full">
    <span>{label}</span>
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={\`h-6 w-6 ml-2 rounded-md \${filterValue ? 'text-primary bg-primary/10' : 'text-muted-foreground/50 hover:text-muted-foreground'}\`}>
          <Filter className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-3 shadow-xl rounded-xl z-50" align="start">
        <div className="space-y-3">
          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Filter by {label}</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <Input
              autoFocus
              className="pl-8 h-9 text-xs"
              placeholder={\`Search \${label.toLowerCase()}...\`}
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
            />
          </div>
          {filterValue && (
             <Button variant="ghost" size="sm" onClick={() => setFilterValue('')} className="h-7 w-full text-[10px] uppercase font-bold tracking-wider">Clear Filter</Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  </div>
);
`;
code = code.replace('const UsersTab = () => {', headerComponent + '\nconst UsersTab = () => {');

// 5. Replace headers
code = code.replace(
  '<TableHead className="text-[10px] font-black uppercase tracking-[0.2em] py-5 text-muted-foreground whitespace-nowrap">Title / Role</TableHead>',
  '<TableHead className="text-[10px] font-black uppercase tracking-[0.2em] py-5 text-muted-foreground whitespace-nowrap"><FilterHeader label="Title / Role" filterValue={filterTitle} setFilterValue={setFilterTitle} /></TableHead>'
);
code = code.replace(
  '<TableHead className="text-[10px] font-black uppercase tracking-[0.2em] py-5 text-muted-foreground whitespace-nowrap">Contact Info</TableHead>',
  '<TableHead className="text-[10px] font-black uppercase tracking-[0.2em] py-5 text-muted-foreground whitespace-nowrap"><FilterHeader label="Contact Info" filterValue={filterContact} setFilterValue={setFilterContact} /></TableHead>'
);
code = code.replace(
  '<TableHead className="text-[10px] font-black uppercase tracking-[0.2em] py-5 text-muted-foreground whitespace-nowrap">Location</TableHead>',
  '<TableHead className="text-[10px] font-black uppercase tracking-[0.2em] py-5 text-muted-foreground whitespace-nowrap"><FilterHeader label="Location" filterValue={filterLocation} setFilterValue={setFilterLocation} /></TableHead>'
);
code = code.replace(
  '<TableHead className="text-[10px] font-black uppercase tracking-[0.2em] py-5 text-muted-foreground whitespace-nowrap">Visa Type</TableHead>',
  '<TableHead className="text-[10px] font-black uppercase tracking-[0.2em] py-5 text-muted-foreground whitespace-nowrap"><FilterHeader label="Visa Type" filterValue={filterVisa} setFilterValue={setFilterVisa} /></TableHead>'
);

fs.writeFileSync('src/components/admin/UsersTab.tsx', code);
