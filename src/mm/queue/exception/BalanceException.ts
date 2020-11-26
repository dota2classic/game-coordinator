export class BalanceException extends Error{
  constructor() {
    super("Can't balance")
  }
}