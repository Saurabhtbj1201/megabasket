import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Meta from '../components/Meta';
import { FiChevronDown, FiSearch } from 'react-icons/fi';
import './FAQPage.css';

const faqData = [
    // Orders & Shipping
    {
        category: 'Orders & Shipping',
        questions: [
            {
                q: 'How do I place an order?',
                a: 'Placing an order is easy! Simply browse our products, add items to your cart, and proceed to checkout. Follow the on-screen instructions to enter your shipping details and payment information to complete your purchase.'
            },
            {
                q: 'Can I change or cancel my order?',
                a: 'You can cancel your order within a short period after placing it, directly from your "My Orders" page. Unfortunately, we cannot modify an order once it has been placed. For more details, please see our <a href="/cancellation-policy">Order Cancellation Policy</a>.'
            },
            {
                q: 'How do I track my order?',
                a: 'Once your order is shipped, you will receive an email with a tracking number and a link. You can also track your order status in the "My Orders" section of your account.'
            },
            {
                q: 'When will I receive my order?',
                a: 'Delivery times vary based on your location and the products ordered. An estimated delivery date will be provided at checkout and in your order confirmation email. Typically, orders are delivered within 3-7 business days.'
            },
            {
                q: 'Do you deliver to my location?',
                a: 'We deliver to most pin codes across the country. You can check delivery availability for your location by entering your pin code on any product page.'
            }
        ]
    },
    // Payments & Pricing
    {
        category: 'Payments & Pricing',
        questions: [
            {
                q: 'What payment methods are accepted?',
                a: 'We accept a wide range of payment methods, including Credit Cards (Visa, MasterCard), Debit Cards, Net Banking, UPI, and Cash on Delivery (COD) for eligible orders.'
            },
            {
                q: 'Is Cash on Delivery available?',
                a: 'Yes, Cash on Delivery (COD) is available for most locations and for orders up to a certain value. You can check for COD availability at checkout.'
            },
            {
                q: 'Are online payments secure?',
                a: 'Absolutely. We use industry-standard SSL encryption to protect your details. All transactions are processed through secure and trusted payment gateways.'
            },
            {
                q: 'I was charged but didn’t receive a confirmation. What should I do?',
                a: 'In rare cases, payment confirmation might be delayed. Please wait for 30 minutes. If you still haven\'t received a confirmation, check your bank account for a debit. If the amount has been debited, please contact our <a href="/contact">Customer Support</a> with your transaction details, and we will resolve it for you.'
            }
        ]
    },
    // Returns & Refunds
    {
        category: 'Returns & Refunds',
        questions: [
            {
                q: 'What is your return policy?',
                a: 'We have a customer-friendly return policy. Most items can be returned within 7-10 days of delivery for a full refund or exchange. Please refer to our detailed <a href="/return-policy">Return & Refund Policy</a> for more information.'
            },
            {
                q: 'How do I return a product?',
                a: 'To return a product, go to the "My Orders" section of your account, select the order containing the item you wish to return, and follow the instructions to initiate the return process.'
            },
            {
                q: 'When will I receive my refund?',
                a: 'Once we receive the returned product and it passes our quality check, we will process your refund. The refund is typically credited to your original payment method within 5-7 business days.'
            }
        ]
    },
    // Account & Security
    {
        category: 'Account & Security',
        icon: '🛡️',
        questions: [
            {
                q: 'How do I create an account?',
                a: 'Click on the "Login/Signup" button at the top of the page and follow the instructions to create your account using your email address or social media profiles.'
            },
            {
                q: 'I forgot my password. How can I reset it?',
                a: 'On the login page, click the "Forgot Password?" link. Enter your registered email address, and we will send you instructions to reset your password.'
            },
            {
                q: 'Is my personal information secure?',
                a: 'Yes, protecting your privacy is a top priority for us. We use advanced security measures to protect your data. For more details, please read our <a href="/privacy">Privacy Policy</a>.'
            },
            {
                q: 'How can I delete my account?',
                a: 'We\'re sorry to see you go. To delete your account, please contact our <a href="/contact">Customer Support</a> team, and they will assist you with the process.'
            }
        ]
    },
    // Customer Support
    {
        category: 'Customer Support',
        questions: [
            {
                q: 'How can I contact customer care?',
                a: 'You can reach our customer support team through our <a href="/contact">Contact Us</a> page via email, phone, or by filling out the contact form.'
            },
            {
                q: 'What are your customer service hours?',
                a: 'Our customer service team is available from Monday to Saturday, 9:00 AM to 6:00 PM.'
            }
        ]
    },
    // Products & Availability
    {
        category: 'Products & Availability',
        icon: '🎁',
        questions: [
            {
                q: 'Are your products eco-friendly or sustainable?',
                a: 'We are committed to sustainability and offer a range of eco-friendly products. Look for the "Eco-Friendly" badge on product pages to identify these items.'
            },
            {
                q: 'How can I check if a product is in stock?',
                a: 'Stock availability is displayed on each product page. If an item is out of stock, you can sign up to be notified when it becomes available again.'
            },
            {
                q: 'Do you offer bulk purchasing?',
                a: 'Yes, we do for certain products. For bulk purchase inquiries, please get in touch with our <a href="/contact">Customer Support</a> team.'
            }
        ]
    },
    // Technical Details
    {
        category: 'Technical Details',
        questions: [
            {
                q: 'What browsers and devices are supported?',
                a: 'Our website is optimized for the latest versions of major browsers like Chrome, Firefox, Safari, and Edge. It is fully responsive and works on desktops, tablets, and mobile devices.'
            },
            {
                q: 'My payment failed. What should I do?',
                a: 'Payment failures can happen due to network issues or incorrect information. Please double-check your card details, and internet connection, and try again. If the problem persists, try a different payment method or contact your bank.'
            },
            {
                q: 'How do I clear my cart or cache?',
                a: 'To clear your cart, you can remove items individually. To clear your browser cache, please refer to your browser\'s help section, as the process varies between browsers. Clearing cache can often resolve display or loading issues.'
            }
        ]
    }
];

const FAQItem = ({ faq, isOpen, onToggle }) => {
    return (
        <div className="faq-item">
            <button className="faq-question" onClick={onToggle}>
                <span>{faq.q}</span>
                <FiChevronDown className={`faq-icon ${isOpen ? 'open' : ''}`} />
            </button>
            {isOpen && <div className="faq-answer" dangerouslySetInnerHTML={{ __html: faq.a }}></div>}
        </div>
    );
};

const FAQPage = () => {
    const [openIndex, setOpenIndex] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleToggle = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const filteredFaqs = useMemo(() => {
        if (!searchTerm) return faqData;

        const lowercasedFilter = searchTerm.toLowerCase();
        const filtered = faqData.map(category => {
            const filteredQuestions = category.questions.filter(
                q => q.q.toLowerCase().includes(lowercasedFilter) || q.a.toLowerCase().includes(lowercasedFilter)
            );
            return { ...category, questions: filteredQuestions };
        }).filter(category => category.questions.length > 0);

        return filtered;
    }, [searchTerm]);

    return (
        <>
            <Meta title="FAQs | MegaBasket" description="Find answers to frequently asked questions about shopping on MegaBasket." />
            <div className="faq-page">
                <header className="faq-header">
                    <div className="container">
                        <h1>Frequently Asked Questions</h1>
                        <p>Find quick answers to your questions below. Can't find what you're looking for? We're here to help!</p>
                        <div className="faq-search-bar">
                            <FiSearch />
                            <input
                                type="text"
                                placeholder="Search for answers... (e.g., 'return policy')"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </header>

                <div className="container faq-content">
                    {filteredFaqs.length > 0 ? filteredFaqs.map((category, catIndex) => (
                        <section key={catIndex} className="faq-category">
                            <h2>{category.icon} {category.category}</h2>
                            {category.questions.map((faq, qIndex) => (
                                <FAQItem
                                    key={qIndex}
                                    faq={faq}
                                    isOpen={openIndex === `${catIndex}-${qIndex}`}
                                    onToggle={() => handleToggle(`${catIndex}-${qIndex}`)}
                                />
                            ))}
                        </section>
                    )) : (
                        <div className="no-results">
                            <h3>No results found for "{searchTerm}"</h3>
                            <p>Try searching with different keywords or check out our popular categories.</p>
                        </div>
                    )}

                    <section className="faq-contact-prompt">
                        <h3>Still need help?</h3>
                        <p>If you can't find the answer you're looking for, our customer support team is ready to assist you.</p>
                        <div className="faq-prompt-actions">
                          <Link to="/contact" className="auth-button">Contact Customer Support</Link>
                          <Link to="/" className="auth-button secondary">Continue Shopping</Link>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
};

export default FAQPage;
