export class BalanceException extends Error {
  constructor(e: string = "Can't balance") {
    super(e);
  }
}
