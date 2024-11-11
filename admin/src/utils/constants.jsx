import { green, red, yellow } from '@mui/material/colors'

import BusinessCenterIcon from '@mui/icons-material/BusinessCenter'
import HotelIcon from '@mui/icons-material/Hotel'
import LocalCafeIcon from '@mui/icons-material/LocalCafe'
import MiscellaneousServicesIcon from '@mui/icons-material/MiscellaneousServices'
import RestaurantIcon from '@mui/icons-material/Restaurant'
import StoreIcon from '@mui/icons-material/Store'
import dayjs from 'dayjs'
import { makeStyles } from '@mui/styles'


export const MAX_UPLOADED_DOCUMENTS = 10
export const MAX_FILE_SIZE_MB = 10
export const allowedImageExtensions = ['.jpg', '.jpeg', '.png']

export const tagColors = [red[500], green[500], yellow[500]]

export const daysOfWeeks = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
}

export const months = [
  {
    key: 'january',
    name: 'misc_month_january',
    shortcut: 'misc_month_january_short',
    index: 0,
  },
  {
    key: 'february',
    name: 'misc_month_february',
    shortcut: 'misc_month_february_short',
    index: 1,
  },
  {
    key: 'march',
    name: 'misc_month_march',
    shortcut: 'misc_month_march_short',
    index: 2,
  },
  {
    key: 'april',
    name: 'misc_month_april',
    shortcut: 'misc_month_april_short',
    index: 3,
  },
  {
    key: 'may',
    name: 'misc_month_may',
    shortcut: 'misc_month_may_short',
    index: 4,
  },
  {
    key: 'june',
    name: 'misc_month_june',
    shortcut: 'misc_month_june_short',
    index: 5,
  },
  {
    key: 'july',
    name: 'misc_month_july',
    shortcut: 'misc_month_july_short',
    index: 6,
  },
  {
    key: 'august',
    name: 'misc_month_august',
    shortcut: 'misc_month_august_short',
    index: 7,
  },
  {
    key: 'september',
    name: 'misc_month_september',
    shortcut: 'misc_month_september_short',
    index: 8,
  },
  {
    key: 'october',
    name: 'misc_month_october',
    shortcut: 'misc_month_october_short',
    index: 9,
  },
  {
    key: 'november',
    name: 'misc_month_november',
    shortcut: 'misc_month_november_short',
    index: 10,
  },
  {
    key: 'december',
    name: 'misc_month_december',
    shortcut: 'misc_month_december_short',
    index: 11,
  },
]
export const months_object = months.reduce((acc, s) => {
  acc[s.key] = { ...s }
  return acc
}, {})

export const formsColumns = {
  position: {
    name: 'misc_position',
  },
  provider: {
    name: 'misc_provider',
  },
  status: {
    name: 'misc_status',
  },
  tin: {
    name: 'misc_tin',
  },
  fullName: {
    name: 'misc_merchant',
  },
  businessName: {
    name: 'misc_store_name',
  },
  businessAddress: {
    name: 'misc_store_address',
  },
  merchantAddress: {
    name: 'misc_store_address',
  },
  terminalId: {
    name: `Terminal ID`,
  },
  terminalQuantity: {
    name: 'misc_quantity',
  },
  dateDecided: {
    name: 'misc_decided_date',
  },
  dateCreated: {
    name: 'misc_created_date',
  },
  partner: {
    name: 'misc_partner',
  },
  telephones: {
    name: 'misc_telephone',
  },
  notes: {
    name: 'misc_notes',
  },
  moveFromForms: {
    name: 'misc_move_from',
  },
  moveToForm: {
    name: 'misc_move_to',
  },
}

export const stores = {
  retail_store: {
    name: `misc_retail_store`,
    icon: StoreIcon,
  },
  cafe: {
    name: `misc_cafe`,
    icon: LocalCafeIcon,
  },
  gastro: {
    name: `misc_restaurant`,
    icon: RestaurantIcon,
  },
  accomodation: {
    name: `misc_accomodation`,
    icon: HotelIcon,
  },
  service: {
    name: `misc_service`,
    icon: MiscellaneousServicesIcon,
  },
  others: {
    name: `misc_others`,
    icon: BusinessCenterIcon,
  },
}

export const banks = new Map([
  ['0100', { name: 'Komerční banka, a.s.', swift: 'KOMBCZPP', shortcut: 'KB' }],
  [
    '0300',
    {
      name: 'Československá obchodní banka, a. s.',
      swift: 'CEKOCZPP',
      shortcut: 'ČSOB',
    },
  ],
  [
    '0600',
    {
      name: 'MONETA Money Bank, a.s.',
      swift: 'AGBACZPP',
      shortcut: 'Moneta',
    },
  ],
  [
    '0710',
    {
      name: 'Česká národní banka',
      swift: 'CNBACZPP',
      shortcut: 'ČNB',
    },
  ],
  [
    '0800',
    {
      name: 'Česká spořitelna, a.s.',
      swift: 'GIBACZPX',
      shortcut: 'ČSAS',
    },
  ],
  [
    '2010',
    {
      name: 'Fio banka, a.s.',
      swift: 'FIOBCZPP',
      shortcut: 'ČSAS',
    },
  ],
  [
    '2060',
    {
      name: 'Citfin, spořitelní družstvo',
      swift: 'CITFCZPP',
      shortcut: 'Citfin',
    },
  ],
  [
    '2070',
    {
      name: 'TRINITY BANK a.s.',
      swift: 'MPUBCZPP',
      shortcut: 'TRINITY',
    },
  ],
  [
    '2100',
    {
      name: 'Hypoteční banka, a.s.',
      swift: '',
      shortcut: 'Hypoteční banka',
    },
  ],
  [
    '2200',
    {
      name: 'Peněžní dům, spořitelní družstvo',
      swift: '',
      shortcut: 'Peněžní dům',
    },
  ],
  [
    '2220',
    {
      name: 'Artesa, spořitelní družstvo',
      swift: 'ARTTCZPP',
      shortcut: 'Artesa',
    },
  ],
  [
    '2250',
    {
      name: 'Banka CREDITAS a.s.',
      swift: 'CTASCZ22',
      shortcut: 'CREDITAS',
    },
  ],
  [
    '2260',
    {
      name: 'NEY spořitelní družstvo',
      swift: '',
      shortcut: 'NEY',
    },
  ],
  [
    '2275',
    {
      name: 'NEY spořitelní družstvo',
      swift: '',
      shortcut: 'NEY',
    },
  ],
  [
    '2600',
    {
      name: 'Citibank Europe plc, organizační složka',
      swift: 'CITICZPX',
      shortcut: 'Citibank',
    },
  ],
  [
    '2700',
    {
      name: 'UniCredit Bank Czech Republic and Slovakia, a.s.',
      swift: 'BACXCZPP',
      shortcut: 'UniCredit',
    },
  ],
  [
    '3030',
    {
      name: 'Air Bank a. s.',
      swift: 'AIRACZPP',
      shortcut: 'Air Bank',
    },
  ],
  [
    '3050',
    {
      name: 'BNP Paribas Personal Finance SA, odštěpný závod',
      swift: 'BPPFCZP1',
      shortcut: 'BNP Paribas',
    },
  ],
  [
    '3060',
    {
      name: 'PKO BP S.A., Czech Branch',
      swift: 'BPKOCZPP',
      shortcut: 'PKO',
    },
  ],
  [
    '3500',
    {
      name: 'ING Bank N.V.',
      swift: 'INGBCZPP',
      shortcut: 'ING Bank',
    },
  ],
  [
    '4000',
    {
      name: 'Max banka a.s.',
      swift: 'EXPNCZPP',
      shortcut: 'Max Banka',
    },
  ],
  [
    '4300',
    {
      name: 'Národní rozvojová banka, a.s.',
      swift: 'NROZCZPP',
      shortcut: 'NRB',
    },
  ],
  [
    '5500',
    {
      name: 'Raiffeisenbank, a.s.',
      swift: 'RZBCCZPP',
      shortcut: 'Raiffeisenbank',
    },
  ],
  [
    '5800',
    {
      name: 'J&T BANKA, a.s.',
      swift: 'JTBPCZPP',
      shortcut: 'J&T',
    },
  ],
  [
    '6000',
    {
      name: 'PPF banka a.s.',
      swift: 'PMBPCZPP',
      shortcut: 'PPF',
    },
  ],
  [
    '6100',
    {
      name: 'Equa Bank a. s.',
      swift: 'EQBKCZPP',
      shortcut: 'PPF',
    },
  ],
  [
    '6200',
    {
      name: 'COMMERZBANK Aktiengesellschaft',
      swift: 'COBACZPX',
      shortcut: 'COMMERZBANK',
    },
  ],
  [
    '6210',
    {
      name: 'mBank S.A., organizační složka',
      swift: 'BREXCZPP',
      shortcut: 'mBank',
    },
  ],
  [
    '6300',
    {
      name: 'BNP Paribas S.A.',
      swift: 'GEBACZPP',
      shortcut: 'BNP Paribas',
    },
  ],
  [
    '6700',
    {
      name: 'Všeobecná úverová banka a.s.',
      swift: 'SUBACZPP',
      shortcut: 'BNP Paribas',
    },
  ],
  [
    '7910',
    {
      name: 'Deutsche Bank Aktiengesellschaft Filiale Prag, organizační složka',
      swift: 'DEUTCZPX',
      shortcut: 'Deutsche Bank',
    },
  ],
  [
    '7950',
    {
      name: 'Raiffeisen stavební spořitelna a.s.',
      swift: '',
      shortcut: 'Raiffeisen stavební spořitelna',
    },
  ],
  [
    '7960',
    {
      name: 'ČSOB Stavební spořitelna a. s.',
      swift: '',
      shortcut: 'ČSOB Stavební spořitelna',
    },
  ],
  [
    '7990',
    {
      name: 'Modrá pyramida stavební spořitelna, a.s.',
      swift: '',
      shortcut: 'MONETA Stavební Spořitelna, a.s.',
    },
  ],
  [
    '8030',
    {
      name: 'Volksbank Raiffeisenbank Nordoberpfalz eG ',
      swift: 'GENOCZ21',
      shortcut: 'Volksbank',
    },
  ],
  [
    '8040',
    {
      name: 'Oberbank AG',
      swift: 'OBKLCZ2X',
      shortcut: 'Oberbank',
    },
  ],
  [
    '8060',
    {
      name: 'Stavební spořitelna České spořitelny, a.s.',
      swift: '',
      shortcut: 'ČSAS Stavební spořitelna',
    },
  ],
  [
    '8090',
    {
      name: 'Česká exportní banka, a.s.',
      swift: 'CZEECZPP',
      shortcut: 'ČEB',
    },
  ],
  [
    '8150',
    {
      name: 'HSBC Continental Europe, Czech Republic',
      swift: 'MIDLCZPP',
      shortcut: 'HSBC',
    },
  ],
  [
    '8190',
    {
      name: 'Sparkasse Oberlausitz-Niederschlesien',
      swift: '',
      shortcut: 'Sparkasse',
    },
  ],
  [
    '8198',
    {
      name: 'FAS finance company s.r.o.',
      swift: 'FFCSCZP1',
      shortcut: 'FAS',
    },
  ],
  [
    '8200',
    {
      name: 'PRIVAT BANK der Raiffeisenlandesbank Oberösterreich Aktiengesellschaft',
      swift: '',
      shortcut: 'PRIVAT BANK',
    },
  ],
  [
    '8220',
    {
      name: 'Payment Execution s.r.o.',
      swift: 'PAERCZP1',
      shortcut: 'Payment Execution',
    },
  ],
  [
    '8230',
    {
      name: 'ABAPAY s.r.o.',
      swift: '',
      shortcut: 'ABAPAY',
    },
  ],
  [
    '8250',
    {
      name: 'Bank of China (CEE) Ltd.',
      swift: 'BKCHCZPP',
      shortcut: 'CEE',
    },
  ],
  [
    '8255',
    {
      name: 'Bank of Communications Co.',
      swift: 'COMMCZPP',
      shortcut: 'Bank of Communications',
    },
  ],
  [
    '8265',
    {
      name: 'Industrial and Commercial Bank of China Limited',
      swift: 'ICBKCZPP',
      shortcut: 'Industrial and Commercial Bank',
    },
  ],
  [
    '8270',
    {
      name: 'Fairplay Pay s.r.o.',
      swift: 'FAPOCZP1',
      shortcut: 'Fairplay Pay',
    },
  ],
  [
    '8280',
    {
      name: 'B-Efekt a.s.',
      swift: 'BEFKCZP1',
      shortcut: 'Fairplay Pay',
    },
  ],
  [
    '8291',
    {
      name: 'Business Credit s.r.o.',
      swift: '',
      shortcut: 'Business Credit',
    },
  ],
  [
    '8293',
    {
      name: 'Mercurius partners s.r.o.',
      swift: '',
      shortcut: 'Mercurius',
    },
  ],
  [
    '8299',
    {
      name: 'BESTPAY s.r.o.',
      swift: 'BEORCZP2',
      shortcut: 'BESTPAY',
    },
  ],
  [
    '8500',
    {
      name: 'Multitude Bank p.l.c.',
      swift: '',
      shortcut: 'Multitude',
    },
  ],
])

export const currencies = {
  czk: {
    code: 'CZK',
    symbol: 'Kč',
  },
  eur: {
    code: 'EUR',
    symbol: '€',
  },
  usd: {
    code: 'USD',
    symbol: '$',
  },
  huf: {
    code: 'HUF',
    symbol: 'Ft',
  },
}

export const plans = {
  currency: { ...currencies.czk },
  plans: {
    small: {
      from: '0',
      to: '150000',
    },
    medium: {
      from: '150001',
      to: '500000',
    },
    large: {
      from: '500000',
      to: 'inf',
    },
  },
}
export const drawerWidth = 240

export const getBankDefaultValues = () => {
  return {
    key: '',
    name: '',
    shortcut: '',
    logo: '',
    website: '',
    provision: 0.0,
    recommended: false,
    plans: [],
  }
}

export const getBankPlanDefaultValues = () => {
  return {
    name: '',
    currency: { ...currencies.czk },
    turnover: {
      from: '0',
      to: 'inf',
    },
    transactionFee: {
      from: 0.0,
      to: 0.0,
      addition: '0.00',
    },
    transferFee: {
      price: '0.00',
      rate: 0.0,
    },
    installation: {
      price: '0.00',
      dateFrom: 1,
      dateTo: 2,
    },
    terminalFee: '0.00',
    ddcReward: 0,
    billingTime: 1,
    technicalSupport: true,
    userSupport: true,
    showOnWeb: true,
  }
}

export const getTerminalDefaultValues = () => {
  return {
    id: '',
    name: '',
    type: '',
    model: '',
    software: 'none',
    softwareName: '',
  }
}

export const getAddressDefaultValues = () => {
  return {
    street: '',
    city: '',
    postalCode: '',
    country: 'Česká republika',
  }
}

export const getResponsiblePersonDefaultValues = () => {
  return {
    firstName: '',
    lastName: '',
    title: '',
    birthNumber: '',
    idNumber: '',
  }
}

export const getBankAccountDefaultValues = () => {
  return {
    prefixNumber: '',
    accountNumber: '',
    bankNumber: '',
    countryCode: 'CZ',
  }
}
export const getMerchantDefaultValues = () => {
  return {
    fullName: '',
    tin: '',
    vin: '',
    emails: [],
    telephones: [],
    address: getAddressDefaultValues(),
    stores: [],
    forms: [],
    person: getResponsiblePersonDefaultValues(),
  }
}

export const getFormBusinessDefaultValues = () => {
  return {
    name: '',
    address: getAddressDefaultValues(),
    store: null,
    email: '',
    telephone: '',
    type: '',
  }
}

export const getFormDefaultValues = () => {
  return {
    business: getFormBusinessDefaultValues(),
    merchant: getMerchantDefaultValues(),
    creators: [],
    creator: '',
    creatorDetail: null,
    dateReturned: null,
    dateDecided: null,
    notes: '',
    provision: '0.00',
    currency: 'czk',
    status: '',
    addition: {
      bankAccount: { ...getBankAccountDefaultValues() },
      unsignedDocuments: {
        documents: [],
        timestamp: null,
      },
      signedDocuments: {
        documents: [],
        timestamp: null,
        isConfirmed: false,
      },
      terminals: [],
      photos: [],
      quantity: 0,
      openDate: '',
      provider: '',
      plan: '',
      isAdditionMailSent: false,
      isUploadSignedMailSent: false,
      isConfirmed: false,
    },
    moveFromForms: [],
    moveToForm: null,
    templateValues: {},
    templateFields: [],
    templates: [],
  }
}

export const billDefaultValues = () => {
  const today = dayjs()
  return {
    userId: '',
    refId: '',
    year: today,
    currency: 'czk',
    isSent: false,
    exposureDate: today,
    expirationDate: today.add(1, 'month'),
    notes: '',
    bankAccount: { ...getBankAccountDefaultValues() },
    items: [],
  }
}
export const billItemDefaultValues = () => {
  return {
    january: {
      totalProvision: 0.0,
      taxRate: 0,
      checked: false,
      name: 'misc_provision_january',
    },
    february: {
      totalProvision: 0.0,
      taxRate: 0,
      checked: false,
      name: 'misc_provision_february',
    },
    march: {
      totalProvision: 0.0,
      taxRate: 0,
      checked: false,
      name: 'misc_provision_march',
    },
    april: {
      totalProvision: 0.0,
      taxRate: 0,
      checked: false,
      name: 'misc_provision_april',
    },
    may: {
      totalProvision: 0.0,
      taxRate: 0,
      checked: false,
      name: 'misc_provision_may',
    },
    june: {
      totalProvision: 0.0,
      taxRate: 0,
      checked: false,
      name: 'misc_provision_june',
    },
    july: {
      totalProvision: 0.0,
      taxRate: 0,
      checked: false,
      name: 'misc_provision_july',
    },
    august: {
      totalProvision: 0.0,
      taxRate: 0,
      checked: false,
      name: 'misc_provision_august',
    },
    september: {
      totalProvision: 0.0,
      taxRate: 0,
      checked: false,
      name: 'misc_provision_september',
    },
    october: {
      totalProvision: 0.0,
      taxRate: 0,
      checked: false,
      name: 'misc_provision_october',
    },
    november: {
      totalProvision: 0.0,
      taxRate: 0,
      checked: false,
      name: 'misc_provision_november',
    },
    december: {
      totalProvision: 0.0,
      taxRate: 0,
      checked: false,
      name: 'misc_provision_december',
    },
  }
}

export const userDefaultValues = () => {
  return {
    username: '',
    name: '',
    email: '',
    telephone: '',
    provision: '0.00',
    bankAccounts: [],
    role: '',
    roles: [],
    merchants: [],
    telephones: [],
    emails: [],
    merchantId: '',
    business: [],
  }
}

export const businessDefaultValues = () => {
  return {
    tin: '',
    vin: '',
    fullName: '',
    email: null,
    telephone: null,
    address: { ...getAddressDefaultValues() },
    taxPayer: false,
  }
}

export const getStoreDefaultValues = () => {
  return {
    _id: '',
    name: '',
    type: '',
    address: {
      street: '',
      city: '',
      postalCode: '',
    },
    forms: [],
  }
}

export const transactionDefaultValues = () => {
  return {
    january: {
      quantity: 0,
      totalPrice: '0.00',
      creator: null,
    },
    february: {
      quantity: 0,
      totalPrice: '0.00',
      creator: null,
    },
    march: {
      quantity: 0,
      totalPrice: '0.00',
      creator: null,
    },
    april: {
      quantity: 0,
      totalPrice: '0.00',
      creator: null,
    },
    may: {
      quantity: 0,
      totalPrice: '0.00',
      creator: null,
    },
    june: {
      quantity: 0,
      totalPrice: '0.00',
      creator: null,
    },
    july: {
      quantity: 0,
      totalPrice: '0.00',
      creator: null,
    },
    august: {
      quantity: 0,
      totalPrice: '0.00',
      creator: null,
    },
    september: {
      quantity: 0,
      totalPrice: '0.00',
      creator: null,
    },
    october: {
      quantity: 0,
      totalPrice: '0.00',
      creator: null,
    },
    november: {
      quantity: 0,
      totalPrice: '0.00',
      creator: null,
    },
    december: {
      quantity: 0,
      totalPrice: '0.00',
      creator: null,
    },
  }
}

export const transactionsDefaultValues = () => {
  const today = dayjs()
  return {
    year: today.startOf('year'),
    providers: [],
    provider: '',
    transactions: transactionDefaultValues(),
    currency: 'CZK',
  }
}

export const formEditTextFieldClasses = makeStyles((theme) => ({
  modified: {
    '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.warning.main,
      borderWidth: '2px',
    },

    '& .MuiInputLabel-outlined': {
      color: theme.palette.warning.main,
    },
  },
  select: {
    '&.MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.warning.main,
      borderWidth: '2px',
    },
    '& .MuiInputLabel-outlined': {
      color: theme.palette.warning.main,
    },
  },
  autofilled: {
    '& .MuiFilledInput-root': {
      backgroundColor: theme.palette.action.focus,
    },
  },
  labelModified: {
    color: theme.palette.warning.main,
  },
}))

export const regex = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  telephone: /^(\+420)? ?[1-9][0-9]{2} ?[0-9]{3} ?[0-9]{3}$/,
  tin: /^\d{8,10}$/,
  vin: /^[A-HJ-NPR-Z0-9]{17}$/,
  iban: /^[A-Z]{2}\d{2}\d{4}\d{4}\d{4}\d{4}\d{2}$/,
}
