export class BalanceException extends Error {
  constructor(e = "Can't balance") {
    super(e);
  }
}
