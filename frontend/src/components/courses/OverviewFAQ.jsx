import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FaQuestionCircle } from "react-icons/fa";

const faqs = [
  {
    question: "Khóa học có giới hạn thời gian không?",
    answer:
      "Không. Sau khi mua, bạn được truy cập trọn đời và có thể xem lại bất cứ lúc nào.",
  },
  {
    question: "Thanh toán như thế nào?",
    answer:
      "Bạn có thể thanh toán qua chuyển khoản ngân hàng, Momo hoặc thẻ quốc tế tùy theo cổng thanh toán được hỗ trợ.",
  },
  {
    question: "Có hỗ trợ hoàn tiền không?",
    answer:
      "Có. Nếu bạn không hài lòng, bạn có thể yêu cầu hoàn tiền trong vòng 7 ngày kể từ ngày mua.",
  },
  {
    question: "Học xong có được xem lại không?",
    answer:
      "Có! Bạn có thể xem lại toàn bộ video, tài liệu và bài tập bất kỳ lúc nào.",
  },
];

const FAQItem = ({ item, isOpen, onClick }) => (
  <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
    <button
      onClick={onClick}
      className="w-full flex justify-between items-center p-3 sm:p-4 focus:outline-none"
    >
      <span className="font-medium text-sm sm:text-base">{item.question}</span>
      <ChevronDown
        className={`transition-transform duration-300 ${
          isOpen ? "rotate-180 text-blue-500" : "text-gray-400"
        }`}
        size={20}
      />
    </button>
    <div
      className={`px-3 sm:px-4 pb-3 sm:pb-4 text-gray-600 leading-relaxed transition-all duration-300 ${
        isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
      }`}
    >
      {item.answer}
    </div>
  </div>
);

const OverviewFAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const toggleItem = (i) => setOpenIndex(openIndex === i ? null : i);

  return (
    <div className="p-4 sm:p-6 md:p-8 rounded-2xl shadow-lg border border-gray-200 mx-auto ">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 flex items-center space-x-2">
        <FaQuestionCircle className="text-red-300" size={40} />
        <span>FAQ – Những câu hỏi thường gặp</span>
      </h2>

      <div className="space-y-3 sm:space-y-4">
        {faqs.map((item, index) => (
          <FAQItem
            key={index}
            item={item}
            isOpen={openIndex === index}
            onClick={() => toggleItem(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default OverviewFAQ;
