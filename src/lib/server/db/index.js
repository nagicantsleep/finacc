import { Sequelize, DataTypes } from 'sequelize';
import config from '../config.js';

import Account from '../../../../models/account.js';
import AccountClass from '../../../../models/accountclass.js';
import AccountRemaining from '../../../../models/accountremaining.js';
import AuditEvent from '../../../../models/auditevent.js';
import CrossSlip from '../../../../models/crossslip.js';
import CrossSlipDetail from '../../../../models/crossslipdetail.js';
import Company from '../../../../models/company.js';
import CompanyClass from '../../../../models/company-class.js';
import Document from '../../../../models/document.js';
import DocumentFile from '../../../../models/document-file.js';
import FiscalYear from '../../../../models/fiscalyear.js';
import MonthlyLog from '../../../../models/monthlylog.js';
import Item from '../../../../models/item.js';
import ItemClass from '../../../../models/itemclass.js';
import ItemFile from '../../../../models/itemfile.js';
import MemberClass from '../../../../models/memberclass.js';
import Menu from '../../../../models/menu.js';
import Project from '../../../../models/project.js';
import Label from '../../../../models/label.js';
import ProjectLabel from '../../../../models/projectlabel.js';
import LabelAccount from '../../../../models/labelaccount.js';
import Sticky from '../../../../models/sticky.js';
import StickyStatus from '../../../../models/stickystatus.js';
import SubAccount from '../../../../models/subaccount.js';
import SubAccountRemaining from '../../../../models/subaccountremaining.js';
import SimulationScenario from '../../../../models/simulationscenario.js';
import SimulationEntry from '../../../../models/simulationentry.js';
import SimulationAssumption from '../../../../models/simulationassumption.js';
import Task from '../../../../models/task.js';
import TaskDetail from '../../../../models/task-detail.js';
import TaxRule from '../../../../models/tax-rule.js';
import TransactionDocument from '../../../../models/transaction-document.js';
import TransactionDetail from '../../../../models/transaction-detail.js';
import TransactionKind from '../../../../models/transaction-kind.js';
import Translation from '../../../../models/translation.js';
import Tenant from '../../../../models/tenant.js';
import TenantMember from '../../../../models/tenantmember.js';
import RegistryDefinition from '../../../../models/registrydefinition.js';
import RegistryEntry from '../../../../models/registryentry.js';
import RegistryTimeline from '../../../../models/registrytimeline.js';
import AttendanceRecord from '../../../../models/attendancerecord.js';
import LeaveRequest from '../../../../models/leaverequest.js';
import SalaryFormula from '../../../../models/salaryformula.js';
import PayrollPeriod from '../../../../models/payrollperiod.js';
import PayrollSlip from '../../../../models/payrollslip.js';
import ExpenseCategory from '../../../../models/expensecategory.js';
import ExpenseAdvance from '../../../../models/expenseadvance.js';
import ExpenseClaim from '../../../../models/expenseclaim.js';
import ExpenseClaimItem from '../../../../models/expenseclaimitem.js';
import User from '../../../../models/user.js';
import Voucher from '../../../../models/voucher.js';
import VoucherClass from '../../../../models/voucherclass.js';
import VoucherFile from '../../../../models/voucherfile.js';

let sequelize;

if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: config.db.logging,
    pool: config.db.pool,
    dialectOptions: config.db.dialectOptions
  });
} else {
  sequelize = new Sequelize(
    config.db.database,
    config.db.username,
    config.db.password,
    {
      host: config.db.host,
      port: config.db.port,
      dialect: 'postgres',
      logging: config.db.logging,
      pool: config.db.pool,
      dialectOptions: config.db.dialectOptions
    }
  );
}

export const models = {
  Account: Account(sequelize, DataTypes),
  AccountClass: AccountClass(sequelize, DataTypes),
  AccountRemaining: AccountRemaining(sequelize, DataTypes),
  AuditEvent: AuditEvent(sequelize, DataTypes),
  CrossSlip: CrossSlip(sequelize, DataTypes),
  CrossSlipDetail: CrossSlipDetail(sequelize, DataTypes),
  Company: Company(sequelize, DataTypes),
  CompanyClass: CompanyClass(sequelize, DataTypes),
  Document: Document(sequelize, DataTypes),
  DocumentFile: DocumentFile(sequelize, DataTypes),
  FiscalYear: FiscalYear(sequelize, DataTypes),
  Item: Item(sequelize, DataTypes),
  ItemClass: ItemClass(sequelize, DataTypes),
  ItemFile: ItemFile(sequelize, DataTypes),
  MemberClass: MemberClass(sequelize, DataTypes),
  Menu: Menu(sequelize, DataTypes),
  MonthlyLog: MonthlyLog(sequelize, DataTypes),
  Project: Project(sequelize, DataTypes),
  Label: Label(sequelize, DataTypes),
  ProjectLabel: ProjectLabel(sequelize, DataTypes),
  LabelAccount: LabelAccount(sequelize, DataTypes),
  RegistryDefinition: RegistryDefinition(sequelize, DataTypes),
  RegistryEntry: RegistryEntry(sequelize, DataTypes),
  RegistryTimeline: RegistryTimeline(sequelize, DataTypes),
  AttendanceRecord: AttendanceRecord(sequelize, DataTypes),
  LeaveRequest: LeaveRequest(sequelize, DataTypes),
  SalaryFormula: SalaryFormula(sequelize, DataTypes),
  PayrollPeriod: PayrollPeriod(sequelize, DataTypes),
  PayrollSlip: PayrollSlip(sequelize, DataTypes),
  ExpenseCategory: ExpenseCategory(sequelize, DataTypes),
  ExpenseAdvance: ExpenseAdvance(sequelize, DataTypes),
  ExpenseClaim: ExpenseClaim(sequelize, DataTypes),
  ExpenseClaimItem: ExpenseClaimItem(sequelize, DataTypes),
  Sticky: Sticky(sequelize, DataTypes),
  StickyStatus: StickyStatus(sequelize, DataTypes),
  SubAccount: SubAccount(sequelize, DataTypes),
  SubAccountRemaining: SubAccountRemaining(sequelize, DataTypes),
  SimulationScenario: SimulationScenario(sequelize, DataTypes),
  SimulationEntry: SimulationEntry(sequelize, DataTypes),
  SimulationAssumption: SimulationAssumption(sequelize, DataTypes),
  Task: Task(sequelize, DataTypes),
  TaskDetail: TaskDetail(sequelize, DataTypes),
  TaxRule: TaxRule(sequelize, DataTypes),
  Translation: Translation(sequelize, DataTypes),
  Tenant: Tenant(sequelize, DataTypes),
  TenantMember: TenantMember(sequelize, DataTypes),
  TransactionDocument: TransactionDocument(sequelize, DataTypes),
  TransactionDetail: TransactionDetail(sequelize, DataTypes),
  TransactionKind: TransactionKind(sequelize, DataTypes),
  User: User(sequelize, DataTypes),
  Voucher: Voucher(sequelize, DataTypes),
  VoucherClass: VoucherClass(sequelize, DataTypes),
  VoucherFile: VoucherFile(sequelize, DataTypes)
};

Object.keys(models).forEach(key => {
  if (models[key].associate) {
    models[key].associate(models);
  }
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;

export { sequelize, Sequelize };
export default models;
